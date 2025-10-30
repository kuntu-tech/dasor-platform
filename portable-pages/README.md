## Portable Pages

This folder contains three routed pages and all required components, hooks, utils, and styles so you can copy them into another project.

### What's included
- `pages/Index.tsx`, `pages/BillingAddMethod.tsx`, `pages/NotFound.tsx`
- `components/` needed by the pages (settings flow, ui primitives)
- `hooks/use-toast.ts`
- `lib/utils.ts`
- `styles/styles.css` (Tailwind CSS tokens used by the UI)
- `AppRoutes.tsx` example wiring with React Router + providers

### How to integrate
1) Copy the entire `portable-pages` folder to your target repo.
2) Ensure your project has these deps: react 18, react-router-dom ^6, @tanstack/react-query, tailwindcss, class-variance-authority, clsx, tailwind-merge, radix-ui packages, lucide-react, sonner, next-themes.
3) Import `portable-pages/styles/styles.css` somewhere global (or merge tokens into your app's CSS).
4) Mount routes by using `AppRoutes` or copy the `Routes` snippet into your router.

Routes:
```tsx
<Route path="/" element={<Index />} />
<Route path="/billing/add-payment" element={<BillingAddMethod />} />
<Route path="*" element={<NotFound />} />
```

Provider wrapper: see `AppRoutes.tsx`.


