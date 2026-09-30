import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchDealsTool from "./tools/search-deals";
import listStoresTool from "./tools/list-stores";
import listBranchesTool from "./tools/list-branches";

const supabaseUrl = (
  process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "https://erdnyfwchudojnxrubsr.supabase.co"
).replace(/\/+$/, "");

export default defineMcp({
  name: "hkeeem",
  title: "hkeeem",
  version: "0.1.0",
  instructions:
    "أدوات للاطلاع على البيانات العامة في تطبيق حكيم: البحث في العروض المنشورة، وقائمة المتاجر الموثّقة، وفروع المتاجر التي لها إحداثيات محفوظة. جميع البيانات موثّقة ومحفوظة ولا تتضمن أي تقديرات.",
  auth: auth.oauth.issuer({
    issuer: `${supabaseUrl}/auth/v1`,
    acceptedAudiences: "authenticated",
    jwksUri: `${supabaseUrl}/auth/v1/.well-known/jwks.json`,
  }),
  tools: [searchDealsTool, listStoresTool, listBranchesTool],
});
