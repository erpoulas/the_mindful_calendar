// The address of every dashboard popup, in one place so links, redirects
// and the route folders can't drift apart.
//
// Each popup is its own route under /dashboard, rendered into the layout's
// @panel slot (src/app/dashboard/@panel/). Opening one renders only the
// popup: the calendar beside it stays as it is, with no queries re-run.
export const dashboardRoutes = {
  calendar: () => "/dashboard",
  dopamineMenu: () => "/dashboard/dopamine-menu",
};
