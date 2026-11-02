import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "kn" | "hi";
export const LANGS: { code: Lang; label: string; speech: string }[] = [
  { code: "en", label: "English", speech: "en-IN" },
  { code: "kn", label: "ಕನ್ನಡ", speech: "kn-IN" },
  { code: "hi", label: "हिन्दी", speech: "hi-IN" },
];

const en = {
  "nav.explore": "Explore",
  "nav.report": "Report",
  "nav.queue": "Queue",
  "nav.admin": "Admin",
  "nav.account": "Account",
  "nav.my": "My reports",
  "nav.signin": "Sign in",
  "nav.signout": "Sign out",
  "home.title": "See a problem in your city? Report it.",
  "home.sub": "Snap a photo, drop a pin, and follow the fix from start to finish.",
  "home.cta": "Report an issue",
  "home.browse": "Browse reports near you",
  "explore.title": "Explore reports",
  "explore.search": "Search by area",
  "explore.allCategories": "All categories",
  "explore.allStatuses": "All statuses",
  "explore.list": "List",
  "explore.map": "Map",
  "explore.loading": "Loading reports...",
  "explore.empty": "No reports match. Be the first to report an issue here.",
  "wiz.title": "Report an issue",
  "wiz.step1": "Photo",
  "wiz.step2": "Location",
  "wiz.step3": "Details",
  "wiz.photoHelp": "Add a photo or short video of the problem (up to 5).",
  "wiz.choose": "Take a photo or choose files",
  "wiz.remove": "Remove",
  "wiz.mapHelp": "Tap the map to drop a pin, or use your location.",
  "wiz.locate": "Use my location",
  "wiz.area": "Area or landmark (shown publicly instead of your exact address)",
  "wiz.category": "What kind of problem is it?",
  "wiz.chooseCat": "Choose a category",
  "wiz.describe": "Describe it briefly",
  "wiz.voice": "Speak instead",
  "wiz.listening": "Listening... tap to stop",
  "wiz.anonymous": "Hide my name on public pages",
  "wiz.nearby": "Already reported nearby? Confirm it instead of filing a new one:",
  "wiz.aiSuggests": "Suggested category:",
  "wiz.use": "Use this",
  "wiz.back": "Back",
  "wiz.next": "Next",
  "wiz.submit": "Submit report",
  "wiz.submitting": "Submitting...",
  "wiz.savedOffline": "You are offline. Your report is saved on this device and will be sent automatically when you are back online.",
  "my.title": "My reports",
  "my.updates": "Updates",
  "my.none": "You have not reported anything yet.",
  "offline.pending": "{n} report(s) waiting to upload",
  "offline.synced": "Uploaded {n} saved report(s)",
  "footer.how": "How it works",
  "footer.impact": "Impact",
  "footer.help": "Help",
  "cat.road": "Road & pothole",
  "cat.streetlight": "Streetlight & electricity",
  "cat.garbage": "Garbage & sanitation",
  "cat.water": "Water & drainage",
  "cat.traffic": "Traffic & public safety",
  "cat.parks": "Parks & public spaces",
  "status.submitted": "Submitted",
  "status.verified": "Verified",
  "status.assigned": "Assigned",
  "status.in_progress": "In progress",
  "status.resolved": "Resolved",
  "status.duplicate": "Duplicate",
  "status.reopened": "Reopened",
  "priority.low": "low",
  "priority.medium": "medium",
  "priority.high": "high",
  "priority.critical": "critical",
} as const;

export type Key = keyof typeof en;

const kn: Record<Key, string> = {
  "nav.explore": "ನೋಡಿ",
  "nav.report": "ವರದಿ ಮಾಡಿ",
  "nav.queue": "ಸರದಿ",
  "nav.admin": "ನಿರ್ವಾಹಕ",
  "nav.account": "ಖಾತೆ",
  "nav.my": "ನನ್ನ ವರದಿಗಳು",
  "nav.signin": "ಸೈನ್ ಇನ್",
  "nav.signout": "ಸೈನ್ ಔಟ್",
  "home.title": "ನಿಮ್ಮ ನಗರದಲ್ಲಿ ಸಮಸ್ಯೆ ಕಂಡರೆ ವರದಿ ಮಾಡಿ.",
  "home.sub": "ಫೋಟೋ ತೆಗೆದು, ಸ್ಥಳ ಗುರುತಿಸಿ, ಪರಿಹಾರದ ಪ್ರತಿ ಹಂತವನ್ನು ಅನುಸರಿಸಿ.",
  "home.cta": "ಸಮಸ್ಯೆ ವರದಿ ಮಾಡಿ",
  "home.browse": "ನಿಮ್ಮ ಹತ್ತಿರದ ವರದಿಗಳನ್ನು ನೋಡಿ",
  "explore.title": "ವರದಿಗಳನ್ನು ಹುಡುಕಿ",
  "explore.search": "ಪ್ರದೇಶದ ಮೂಲಕ ಹುಡುಕಿ",
  "explore.allCategories": "ಎಲ್ಲಾ ವರ್ಗಗಳು",
  "explore.allStatuses": "ಎಲ್ಲಾ ಸ್ಥಿತಿಗಳು",
  "explore.list": "ಪಟ್ಟಿ",
  "explore.map": "ನಕ್ಷೆ",
  "explore.loading": "ವರದಿಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...",
  "explore.empty": "ಯಾವುದೇ ವರದಿ ಸಿಗಲಿಲ್ಲ. ಇಲ್ಲಿ ಮೊದಲ ವರದಿ ನೀವೇ ಮಾಡಿ.",
  "wiz.title": "ಸಮಸ್ಯೆ ವರದಿ ಮಾಡಿ",
  "wiz.step1": "ಫೋಟೋ",
  "wiz.step2": "ಸ್ಥಳ",
  "wiz.step3": "ವಿವರ",
  "wiz.photoHelp": "ಸಮಸ್ಯೆಯ ಫೋಟೋ ಅಥವಾ ಚಿಕ್ಕ ವೀಡಿಯೊ ಸೇರಿಸಿ (ಗರಿಷ್ಠ 5).",
  "wiz.choose": "ಫೋಟೋ ತೆಗೆಯಿರಿ ಅಥವಾ ಫೈಲ್ ಆಯ್ಕೆ ಮಾಡಿ",
  "wiz.remove": "ತೆಗೆದುಹಾಕಿ",
  "wiz.mapHelp": "ನಕ್ಷೆಯ ಮೇಲೆ ಒತ್ತಿ ಪಿನ್ ಇಡಿ, ಅಥವಾ ನಿಮ್ಮ ಸ್ಥಳವನ್ನು ಬಳಸಿ.",
  "wiz.locate": "ನನ್ನ ಸ್ಥಳ ಬಳಸಿ",
  "wiz.area": "ಪ್ರದೇಶ ಅಥವಾ ಗುರುತು (ನಿಮ್ಮ ನಿಖರ ವಿಳಾಸದ ಬದಲು ಸಾರ್ವಜನಿಕವಾಗಿ ತೋರಿಸಲಾಗುತ್ತದೆ)",
  "wiz.category": "ಇದು ಯಾವ ರೀತಿಯ ಸಮಸ್ಯೆ?",
  "wiz.chooseCat": "ವರ್ಗವನ್ನು ಆರಿಸಿ",
  "wiz.describe": "ಸಂಕ್ಷಿಪ್ತವಾಗಿ ವಿವರಿಸಿ",
  "wiz.voice": "ಮಾತನಾಡಿ",
  "wiz.listening": "ಕೇಳುತ್ತಿದೆ... ನಿಲ್ಲಿಸಲು ಒತ್ತಿ",
  "wiz.anonymous": "ಸಾರ್ವಜನಿಕ ಪುಟಗಳಲ್ಲಿ ನನ್ನ ಹೆಸರು ಮರೆಮಾಡಿ",
  "wiz.nearby": "ಹತ್ತಿರದಲ್ಲೇ ಈಗಾಗಲೇ ವರದಿಯಾಗಿದೆಯೇ? ಹೊಸದನ್ನು ಸಲ್ಲಿಸುವ ಬದಲು ಅದನ್ನು ಖಚಿತಪಡಿಸಿ:",
  "wiz.aiSuggests": "ಸೂಚಿತ ವರ್ಗ:",
  "wiz.use": "ಇದನ್ನು ಬಳಸಿ",
  "wiz.back": "ಹಿಂದೆ",
  "wiz.next": "ಮುಂದೆ",
  "wiz.submit": "ವರದಿ ಸಲ್ಲಿಸಿ",
  "wiz.submitting": "ಸಲ್ಲಿಸಲಾಗುತ್ತಿದೆ...",
  "wiz.savedOffline": "ನೀವು ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿದ್ದೀರಿ. ನಿಮ್ಮ ವರದಿ ಈ ಸಾಧನದಲ್ಲಿ ಉಳಿದಿದೆ ಮತ್ತು ಆನ್‌ಲೈನ್ ಬಂದ ಕೂಡಲೇ ತಾನಾಗಿಯೇ ಕಳುಹಿಸಲಾಗುತ್ತದೆ.",
  "my.title": "ನನ್ನ ವರದಿಗಳು",
  "my.updates": "ಅಪ್‌ಡೇಟ್‌ಗಳು",
  "my.none": "ನೀವು ಇನ್ನೂ ಯಾವುದನ್ನೂ ವರದಿ ಮಾಡಿಲ್ಲ.",
  "offline.pending": "{n} ವರದಿ(ಗಳು) ಅಪ್‌ಲೋಡ್‌ಗಾಗಿ ಕಾಯುತ್ತಿವೆ",
  "offline.synced": "{n} ಉಳಿಸಿದ ವರದಿ(ಗಳು) ಅಪ್‌ಲೋಡ್ ಆಗಿವೆ",
  "footer.how": "ಇದು ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ",
  "footer.impact": "ಪರಿಣಾಮ",
  "footer.help": "ಸಹಾಯ",
  "cat.road": "ರಸ್ತೆ ಮತ್ತು ಗುಂಡಿ",
  "cat.streetlight": "ಬೀದಿ ದೀಪ ಮತ್ತು ವಿದ್ಯುತ್",
  "cat.garbage": "ಕಸ ಮತ್ತು ನೈರ್ಮಲ್ಯ",
  "cat.water": "ನೀರು ಮತ್ತು ಚರಂಡಿ",
  "cat.traffic": "ಸಂಚಾರ ಮತ್ತು ಸಾರ್ವಜನಿಕ ಸುರಕ್ಷತೆ",
  "cat.parks": "ಉದ್ಯಾನ ಮತ್ತು ಸಾರ್ವಜನಿಕ ಸ್ಥಳಗಳು",
  "status.submitted": "ಸಲ್ಲಿಸಲಾಗಿದೆ",
  "status.verified": "ಪರಿಶೀಲಿಸಲಾಗಿದೆ",
  "status.assigned": "ನಿಯೋಜಿಸಲಾಗಿದೆ",
  "status.in_progress": "ಪ್ರಗತಿಯಲ್ಲಿದೆ",
  "status.resolved": "ಪರಿಹರಿಸಲಾಗಿದೆ",
  "status.duplicate": "ಪುನರಾವರ್ತಿತ",
  "status.reopened": "ಮತ್ತೆ ತೆರೆಯಲಾಗಿದೆ",
  "priority.low": "ಕಡಿಮೆ",
  "priority.medium": "ಮಧ್ಯಮ",
  "priority.high": "ಹೆಚ್ಚು",
  "priority.critical": "ತೀವ್ರ",
};

const hi: Record<Key, string> = {
  "nav.explore": "देखें",
  "nav.report": "रिपोर्ट करें",
  "nav.queue": "कतार",
  "nav.admin": "एडमिन",
  "nav.account": "खाता",
  "nav.my": "मेरी रिपोर्ट",
  "nav.signin": "साइन इन",
  "nav.signout": "साइन आउट",
  "home.title": "अपने शहर में कोई समस्या दिखी? रिपोर्ट करें।",
  "home.sub": "फोटो लें, स्थान चिह्नित करें, और समाधान की हर प्रगति देखें।",
  "home.cta": "समस्या दर्ज करें",
  "home.browse": "अपने आस-पास की रिपोर्ट देखें",
  "explore.title": "रिपोर्ट खोजें",
  "explore.search": "क्षेत्र के अनुसार खोजें",
  "explore.allCategories": "सभी श्रेणियाँ",
  "explore.allStatuses": "सभी स्थितियाँ",
  "explore.list": "सूची",
  "explore.map": "नक्शा",
  "explore.loading": "रिपोर्ट लोड हो रही हैं...",
  "explore.empty": "कोई रिपोर्ट नहीं मिली। यहाँ पहली रिपोर्ट आप दर्ज करें।",
  "wiz.title": "समस्या दर्ज करें",
  "wiz.step1": "फोटो",
  "wiz.step2": "स्थान",
  "wiz.step3": "विवरण",
  "wiz.photoHelp": "समस्या की फोटो या छोटा वीडियो जोड़ें (अधिकतम 5)।",
  "wiz.choose": "फोटो लें या फ़ाइलें चुनें",
  "wiz.remove": "हटाएँ",
  "wiz.mapHelp": "पिन लगाने के लिए नक्शे पर टैप करें, या अपना स्थान उपयोग करें।",
  "wiz.locate": "मेरा स्थान उपयोग करें",
  "wiz.area": "क्षेत्र या पहचान स्थल (आपके सटीक पते की जगह सार्वजनिक रूप से दिखाया जाएगा)",
  "wiz.category": "यह किस प्रकार की समस्या है?",
  "wiz.chooseCat": "श्रेणी चुनें",
  "wiz.describe": "संक्षेप में बताएँ",
  "wiz.voice": "बोलकर बताएँ",
  "wiz.listening": "सुन रहा है... रोकने के लिए टैप करें",
  "wiz.anonymous": "सार्वजनिक पेजों पर मेरा नाम छिपाएँ",
  "wiz.nearby": "क्या पास में पहले से रिपोर्ट है? नई रिपोर्ट की जगह उसकी पुष्टि करें:",
  "wiz.aiSuggests": "सुझाई गई श्रेणी:",
  "wiz.use": "यह चुनें",
  "wiz.back": "वापस",
  "wiz.next": "आगे",
  "wiz.submit": "रिपोर्ट जमा करें",
  "wiz.submitting": "जमा हो रही है...",
  "wiz.savedOffline": "आप ऑफ़लाइन हैं। आपकी रिपोर्ट इस डिवाइस पर सहेजी गई है और ऑनलाइन होते ही अपने-आप भेज दी जाएगी।",
  "my.title": "मेरी रिपोर्ट",
  "my.updates": "अपडेट",
  "my.none": "आपने अभी तक कुछ भी दर्ज नहीं किया है।",
  "offline.pending": "{n} रिपोर्ट अपलोड के लिए प्रतीक्षा में",
  "offline.synced": "{n} सहेजी गई रिपोर्ट अपलोड हो गई",
  "footer.how": "यह कैसे काम करता है",
  "footer.impact": "प्रभाव",
  "footer.help": "सहायता",
  "cat.road": "सड़क और गड्ढे",
  "cat.streetlight": "स्ट्रीटलाइट और बिजली",
  "cat.garbage": "कचरा और स्वच्छता",
  "cat.water": "पानी और जल निकासी",
  "cat.traffic": "यातायात और सार्वजनिक सुरक्षा",
  "cat.parks": "पार्क और सार्वजनिक स्थान",
  "status.submitted": "जमा की गई",
  "status.verified": "सत्यापित",
  "status.assigned": "सौंपी गई",
  "status.in_progress": "प्रगति में",
  "status.resolved": "हल हो गई",
  "status.duplicate": "दोहराव",
  "status.reopened": "फिर से खोली गई",
  "priority.low": "कम",
  "priority.medium": "मध्यम",
  "priority.high": "उच्च",
  "priority.critical": "गंभीर",
};

const DICT: Record<Lang, Record<Key, string>> = { en, kn, hi };

interface I18n {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: Key, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18n>({ lang: "en", setLang: () => {}, t: (k) => en[k] });

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem("lang");
    if (saved === "en" || saved === "kn" || saved === "hi") return saved;
  } catch {
    /* storage blocked: fall back to English */
  }
  return "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("lang", l);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback<I18n["t"]>(
    (key, vars) => {
      let s = DICT[lang][key] ?? en[key];
      if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
      return s;
    },
    [lang]
  );

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
