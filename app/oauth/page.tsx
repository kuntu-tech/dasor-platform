export const metadata = {
  title: "OAuth",
  description: "OAuth entry point",
};

export default function OAuthIndexPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-semibold text-gray-900">OAuth callback only</h1>
        <p className="text-gray-600">
          This endpoint is only used by the Stripe authorization callback. Please start the
          connection flow from the settings page in the dashboard.
        </p>
      </div>
    </div>
  );
}


