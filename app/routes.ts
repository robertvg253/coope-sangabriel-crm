import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route("home", "routes/home.tsx"),
  route("test-db", "routes/test-db.tsx"),
  layout("routes/_layout.tsx", [
    route("export-pdf", "routes/export-pdf.tsx"),
  ]),
  layout("routes/_app-layout.tsx", [
    route("leads", "routes/leads/index.tsx"),
    route("campanas/sms", "routes/campanas/sms/index.tsx"),
    route("campanas/sms/:campaignNumber", "routes/campanas/sms/$campaignNumber/index.tsx"),
    route("campanas/email", "routes/campanas/email/index.tsx"),
    route("campanas/email/:campaignNumber", "routes/campanas/email/$campaignNumber/index.tsx"),
    route("anuncios", "routes/anuncios/index.tsx"),
    route("reportes", "routes/reportes/index.tsx"),
    route("empleados", "routes/empleados/index.tsx"),
  ]),
] satisfies RouteConfig;
