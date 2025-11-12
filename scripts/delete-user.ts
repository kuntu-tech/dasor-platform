import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

type Target = {
  userId?: string;
  email?: string;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.log(
    "Missing Supabase credentials. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
  );
  process.exit(1);
}

const parseArgs = (): Target => {
  const args = process.argv.slice(2);
  const target: Target = {};

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if ((arg === "--user-id" || arg === "-u") && args[i + 1]) {
      target.userId = args[i + 1];
      i += 1;
    } else if ((arg === "--email" || arg === "-e") && args[i + 1]) {
      target.email = args[i + 1];
      i += 1;
    } else if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    }
  }

  return target;
};

const printUsage = () => {
  console.log(`
Usage:
  pnpm tsx scripts/delete-user.ts --user-id <uuid>
  pnpm tsx scripts/delete-user.ts --email <user@example.com>

Flags:
  -u, --user-id   Delete by Supabase auth user id (UUID)
  -e, --email     Delete by email address (exact match)
  -h, --help      Show this message
`);
};

const main = async () => {
  const target = parseArgs();

  if (!target.userId && !target.email) {
    console.log("You must provide either --user-id or --email.");
    printUsage();
    process.exit(1);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  let userId = target.userId;

  try {
    if (!userId && target.email) {
      const { data: profileMatch, error: profileError } = await admin
        .from("users")
        .select("id")
        .eq("email", target.email)
        .maybeSingle();

      if (profileError) {
        console.warn(
          "Failed to query public.users by email. Falling back to auth list:",
          profileError.message
        );
      }

      if (profileMatch?.id) {
        userId = profileMatch.id as string;
      } else {
        const pageSize = 200;
        const maxPages = 10;
        let page = 1;
        let foundUserId: string | undefined;

        while (page <= maxPages && !foundUserId) {
          const { data: listResult, error: listError } =
            await admin.auth.admin.listUsers({
              page,
              perPage: pageSize,
            });

          if (listError) {
            console.log(
              "Failed to list auth users while searching by email:",
              listError.message
            );
            process.exit(1);
          }

          const match = listResult.users.find(
            (u) => u.email?.toLowerCase() === target.email!.toLowerCase()
          );

          if (match) {
            foundUserId = match.id;
            break;
          }

          if (listResult.users.length < pageSize) {
            break;
          }

          page += 1;
        }

        if (foundUserId) {
          userId = foundUserId;
        } else {
          console.log("No user found for the provided email.");
          process.exit(1);
        }
      }
    }

    if (!userId) {
      throw new Error("Unable to resolve user id.");
    }

    const resolvedUserId = userId;

    console.log(`Deleting user ${resolvedUserId} ...`);

    const { error: authDeleteError } =
      await admin.auth.admin.deleteUser(resolvedUserId);
    if (authDeleteError) {
      console.log("Failed to delete auth user:", authDeleteError.message);
      process.exit(1);
    }
    console.log("Auth user deleted.");

    const { error: profileDeleteError } = await admin
      .from("users")
      .delete()
      .eq("id", resolvedUserId);

    if (profileDeleteError) {
      console.warn(
        "Auth user removed, but deleting from public.users failed:",
        profileDeleteError.message
      );
    } else {
      console.log("Profile removed from public.users.");
    }

    console.log(
      "Done. Review other tables referencing user_id if cascading cleanup is required."
    );
  } catch (error) {
    console.log("Unexpected error while deleting user:", error);
    process.exit(1);
  }
};

main();

