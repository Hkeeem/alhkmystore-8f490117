import { defineMcp } from "@lovable.dev/mcp-js";
import searchDealsTool from "./tools/search-deals";
import listStoresTool from "./tools/list-stores";
import listBranchesTool from "./tools/list-branches";

export default defineMcp({
  name: "hkeeem",
  title: "hkeeem",
  version: "0.1.0",
  instructions:
    "أدوات للاطلاع على البيانات العامة في تطبيق حكيم: البحث في العروض المنشورة، وقائمة المتاجر الموثّقة، وفروع المتاجر التي لها إحداثيات محفوظة. جميع البيانات موثّقة ومحفوظة ولا تتضمن أي تقديرات.",
  tools: [searchDealsTool, listStoresTool, listBranchesTool],
});
