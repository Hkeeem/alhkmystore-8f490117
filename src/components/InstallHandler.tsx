import { useEffect, useState } from "react";
import { useLocation, useRouter } from "@tanstack/react-router";
import { Download, X } from "lucide-react";
import { registerSW } from "@/lib/register-sw";

const PENDING_KEY = "hkeeem_pending_deeplink";
const DISMISS_KEY = "hkeeem_install_hidden";

type BIPEvent = Event & {
prompt: () => Promise<void>;
userChoice: Promise<{
outcome: "accepted" | "dismissed";
}>;
};

function isStandalone() {
if (typeof window === "undefined") return false;

return (
window.matchMedia?.("(display-mode: standalone)").matches ||
// @ts-expect-error
window.navigator.standalone === true
);
}

export function InstallHandler() {
const router = useRouter();
const location = useLocation();

const [bip, setBip] = useState<BIPEvent | null>(null);
const [visible, setVisible] = useState(false);
const [iosHint, setIosHint] = useState(false);

useEffect(() => {
if (typeof window === "undefined") return;

const path =  
  window.location.pathname +  
  window.location.search;  

if (path !== "/" && !path.startsWith("/?")) {  
  try {  
    localStorage.setItem(PENDING_KEY, path);  
  } catch {}  
}

}, [location.pathname, location.search]);

useEffect(() => {
if (
typeof window === "undefined" ||
!isStandalone()
)
return;

try {  
  const current =  
    window.location.pathname +  
    window.location.search;  

  const target =  
    localStorage.getItem(PENDING_KEY);  

  if (target && target !== current) {  
    localStorage.removeItem(PENDING_KEY);  

    router.navigate({  
      to: target,  
    });  
  }  
} catch {}  

// eslint-disable-next-line react-hooks/exhaustive-deps

}, []);

useEffect(() => {
void registerSW();
}, []);

useEffect(() => {
if (
typeof window === "undefined" ||
isStandalone()
)
return;

const dismissed =  
  localStorage.getItem(DISMISS_KEY) ===  
  "true";  

const onBIP = (e: Event) => {  
  e.preventDefault();  

  setBip(e as BIPEvent);  

  if (!dismissed) {  
    setVisible(true);  
  }  
};  

const onInstalled = () => {  
  setVisible(false);  

  setBip(null);  

  try {  
    localStorage.setItem(  
      DISMISS_KEY,  
      "true"  
    );  
  } catch {}  
};  

window.addEventListener(  
  "beforeinstallprompt",  
  onBIP  
);  

window.addEventListener(  
  "appinstalled",  
  onInstalled  
);  
const ua = window.navigator.userAgent;  

const isIos =  
  /iPad|iPhone|iPod/.test(ua) &&  
  !/CriOS|FxiOS/.test(ua);  

const onDeepLink =  
  location.pathname.startsWith("/deals/") ||  
  location.pathname === "/smart-list";  

if (isIos && onDeepLink && !dismissed) {  
  setIosHint(true);  
  setVisible(true);  
}  

return () => {  
  window.removeEventListener(  
    "beforeinstallprompt",  
    onBIP  
  );  

  window.removeEventListener(  
    "appinstalled",  
    onInstalled  
  );  
};

}, [location.pathname]);

async function install() {
if (!bip) return;

await bip.prompt();  

const choice = await bip.userChoice;  

if (choice.outcome === "accepted") {  
  setVisible(false);  

  try {  
    localStorage.setItem(  
      DISMISS_KEY,  
      "true"  
    );  
  } catch {}  
} else {  
  dismiss();  
}

}

function dismiss() {
setVisible(false);

try {  
  localStorage.setItem(  
    DISMISS_KEY,  
    "true"  
  );  
} catch {}

}

if (!visible) return null;

return (
<div className="fixed bottom-5 left-1/2 -translate-x-1/2 w-[94%] max-w-md z-50">

<div className="relative rounded-3xl bg-[#111111]/95 backdrop-blur-xl border border-[#D4AF37]/40 shadow-[0_0_40px_rgba(212,175,55,.25)] overflow-hidden">  

    <button  
      onClick={dismiss}  
      className="absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center bg-[#1d1d1d] hover:bg-[#D4AF37]/20 transition z-10"  
    >  
      <X className="w-4 h-4 text-[#D4AF37]" />  
    </button>  

    <div className="p-5 flex items-center gap-4">  

      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#f6e7a7] via-[#D4AF37] to-[#8f6b10] p-[2px] shrink-0 shadow-[0_0_15px_rgba(212,175,55,0.4)]">  
        <img  
          src="/164238.jpg"  
          alt="Hkeeem AI"  
          className="w-full h-full rounded-[14px] bg-black object-contain"  
        />  
      </div>  

      <div className="flex-1 min-w-0 pr-2">  
        <h2 className="font-['Cairo'] font-black text-xl text-transparent bg-clip-text bg-gradient-to-b from-[#f3e5ab] to-[#aa771c]">  
          Hkeeem AI  
        </h2>  
        <p className="mt-1 text-xs text-neutral-300 leading-relaxed font-medium">  
          {iosHint  
            ? "أضف Hkeeem AI للشاشة الرئيسية من قائمة المشاركة."  
            : "ثبّت التطبيق لتجربة أسرع وأفضل."}  
        </p>  

        {!iosHint && bip && (  
          <button  
            onClick={install}  
            className="  
              mt-4  
              w-full  
              flex  
              items-center  
              justify-center  
              gap-2  
              rounded-xl  
              py-2.5  
              text-xs  
              font-bold  
              text-black  
              bg-gradient-to-r  
              from-[#F7E7A8]  
              via-[#D4AF37]  
              to-[#9E7408]  
              hover:scale-[1.02]  
              active:scale-[0.98]  
              transition-all  
              duration-200  
              shadow-[0_4px_15px_rgba(212,175,55,0.4)]  
            "  
          >  
            <Download className="w-4 h-4 text-black" />  
            تثبيت الآن  
          </button>  
        )}  

      </div>  

    </div>  

    <div className="px-5 pb-4">  
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent mb-3" />  
      <p className="text-[11px] text-center text-neutral-500 font-medium">  
        © Hkeeem AI • Smart Shopping Platform  
      </p>  
    </div>  

  </div>  

</div>

);
}
