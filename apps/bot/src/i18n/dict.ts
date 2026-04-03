import type { BotLocale } from "../types/session.js";

/** Flat message/button strings; use {name} for interpolation via tr(). */
export type Dict = Record<string, string>;

const en: Dict = {
  chooseLanguageTitle: "🌐 <b>Choose your language</b>",
  chooseLanguageHint:
    "You can change this anytime from the menu with <b>Language / ቋንቋ</b>.",

  welcomeTitle: "✨ <b>EthioTransit</b>",
  welcomeSub: "Intercity bus booking — same account as web &amp; app.",
  welcomeBody:
    "Use the buttons below or <code>/login</code> then <b>Search bus</b>.",

  helpTitle: "<b>Commands</b>",
  helpStart: "/start — main menu",
  helpLogin: "/login — link passenger account",
  helpBookings: "/bookings — your trips",
  helpCancel: "/cancel — stop current search",

  cancelDone: "Cancelled. Open the menu to start again.",
  somethingWrong: "Something went wrong. Try /start or /cancel.",

  needLoginTitle: "Sign in first",
  needLoginBody:
    "Use:\n<code>/login +251900000000 123456</code>\n(phone, space, OTP — dev matches API <code>AUTH_DEV_CODE</code>)",

  loginUsage: "Usage: <code>/login +2519xxxxxxxx 123456</code>",
  loginSigning: "⏳ Signing you in…",
  loginPassengerOnly: "This bot is for <b>passenger</b> accounts. Use a passenger phone.",
  loginOk: "✅ Linked as <code>{phone}</code>. You can search and book.",
  loginFailed: "Login failed: {error}",

  mainMenuLabel: "Main menu",
  loadingBookings: "⏳ Loading bookings…",
  noBookings: "No bookings yet.",
  myBookingsHeader: "🎫 <b>My bookings</b>",

  ticketTitle: "🎫 <b>Ticket / booking</b>",
  ticketStatus: "Status",
  ticketRoute: "Route",
  ticketDeparture: "Departure",
  ticketSeats: "Seats",
  ticketTotal: "Total",
  ticketId: "Booking ID",
  ticketLoadError: "Could not load ticket: {error}",
  ticketSaved: "Booking saved. Open the app or web for full details.",

  loginPromptCb:
    "Send <code>/login +2519xxxxxxxx 123456</code> with your passenger phone and OTP.",

  loadingPopular: "⏳ Loading popular routes…",
  pickPopular: "Pick a <b>popular route</b> or choose cities manually:",
  loadingCities: "⏳ Loading cities…",
  selectOrigin: "📍 Select <b>origin</b> city:",
  selectDest: "Origin: <b>{origin}</b>\nSelect <b>destination</b>:",
  routePickDay: "Route: <b>{origin}</b> → <b>{dest}</b>\nPick travel day:",
  arrowRoute: "<b>{origin}</b> → <b>{dest}</b>\nPick travel day:",
  searchingRoutes:
    "⏳ Searching <b>{origin}</b> → <b>{dest}</b> on <code>{date}</code>…",
  noRoutes: "No routes for this pair. Try other cities or dates.",
  selectRoute: "Select operator / route:",
  loadingDepartures: "⏳ Loading departures…",
  noDepartures: "No buses that day. Pick another route or date.",
  selectDeparture: "Select a departure:",
  loadingSeats: "⏳ Loading seats…",
  noSeats: "No seats available on this bus.",
  seatHeader: "Bus <b>{plate}</b> · {time}",
  seatPrice: "Price <b>{price} ETB</b> / seat",
  seatSelected: "Selected: <b>{seats}</b>",
  seatNone: "none",
  seatHint: "Tap seats to toggle, then <b>Book these seats</b>.",
  seatNotAvail: "Seat not available",
  pickDifferentCity: "Pick a different city",

  creatingBooking: "⏳ Creating booking…",
  bookingCreated: "✅ <b>Booking created</b> (pending payment)",
  bookingId: "ID",
  bookingSeats: "Seats",
  bookingTotal: "Total",
  choosePayment: "Choose payment:",

  skipPaid: "⏭ Skip (already paid)",
  noBookingSession: "No recent booking in session.",
  noBookingPay: "No booking to pay.",

  mpesaTitle: "<b>M-Pesa STK push</b>",
  mpesaPhone: "Send your M-Pesa phone (e.g. <code>2547…</code> or <code>07…</code>).",
  mpesaSame: "Reply <b>same</b> to use your linked phone <code>{phone}</code>.",
  mpesaStart: "⏳ Starting M-Pesa…",
  mpesaMock: "✅ Payment completed (dev/mock). Your ticket:",
  mpesaPrompt:
    "📱 Check your phone for the M-Pesa prompt.\nCheckout ref: <code>{ref}</code>\n\nWhen paid, use <b>My bookings</b> or /bookings.",
  invalidPhone: "Invalid phone. Try again.",

  chapaEmail: "Send your email for the Chapa checkout link.",
  chapaStart: "⏳ Starting Chapa…",
  chapaMock: "✅ Payment completed (dev/mock). Your ticket:",
  chapaLink: "Pay here: {url}\nTx: <code>{ref}</code>",
  chapaFallback: "Chapa initiated — check your email or SMS for next steps.",
  invalidEmail: "That doesn’t look like an email. Try again.",

  sessionExpired: "Session expired. Search again.",
  cityNotFound: "City not found. Start search again.",
  cityNotFoundShort: "City not found.",
  startSearchAgain: "Start search again from the menu.",
  routeUnavailable: "This route is no longer available. Try /start → Search.",

  selectOneSeat: "Select at least one seat",
  cancelledShort: "Cancelled.",

  languageSet: "✅ Language set to <b>{label}</b>.",

  // Buttons
  btn_search: "🔍 Search bus",
  btn_bookings: "🎫 My bookings",
  btn_login: "🔐 Link / login",
  btn_language: "🌐 Language / ቋንቋ",
  btn_mpesa: "M-Pesa",
  btn_chapa: "Chapa",
  btn_pick_cities: "📍 Pick cities manually",
  btn_book_seats: "✅ Book these seats",
  btn_cancel: "❌ Cancel",
  btn_today: "Today",
  btn_tomorrow: "+1",
  btn_plus2: "+2",
  btn_plus3: "+3",
  btn_plus4: "+4",
  btn_plus5: "+5",
  btn_plus6: "+6",
};

const am: Dict = {
  chooseLanguageTitle: "🌐 <b>ቋንቋዎን ይምረጡ</b>",
  chooseLanguageHint: "በሜኑ ከ <b>Language / ቋንቋ</b> በማንኛውም ጊዜ መቀየር ይችላሉ።",

  welcomeTitle: "✨ <b>ኢትዮትራንዚት</b>",
  welcomeSub: "የከተማ መካከል አውቶቡስ — ከድር እና መተግበሪያ ጋር ተመሳሳይ መለያ።",
  welcomeBody: "ከታች ያሉ አዝራሮችን ይጠቀሙ ወይም <code>/login</code> ከዚያ <b>መረመር</b>።",

  helpTitle: "<b>ትዕዛዞች</b>",
  helpStart: "/start — ዋና ሜኑ",
  helpLogin: "/login — የተጓዥ መለያ ማገናኘት",
  helpBookings: "/bookings — ጉዞዎችዎ",
  helpCancel: "/cancel — ፍለጋ ማቆም",

  cancelDone: "ተቋርጧል። እንደገና ከሜኑ ይጀምሩ።",
  somethingWrong: "ስህተት ተፈጥሯል። /start ወይም /cancel ይሞክሩ።",

  needLoginTitle: "መግባት ያስፈልጋል",
  needLoginBody:
    "ይህን ይጠቀሙ:\n<code>/login +251900000000 123456</code>\n(ስልክ፣ ቦታ፣ OTP — በdev API <code>AUTH_DEV_CODE</code>)",

  loginUsage: "አጠቃቀም: <code>/login +2519xxxxxxxx 123456</code>",
  loginSigning: "⏳ በመግባት ላይ…",
  loginPassengerOnly: "ይህ ቦት ለ<b>ተጓዦች</b> ብቻ ነው። የተጓዥ ስልክ ይጠቀሙ።",
  loginOk: "✅ እንደ <code>{phone}</code> ተገናኝቷል። መፈለግ እና መያዝ ይችላሉ።",
  loginFailed: "መግባት አልተሳካም: {error}",

  mainMenuLabel: "ዋና ሜኑ",
  loadingBookings: "⏳ ቦታዎች በመጫን ላይ…",
  noBookings: "እስካሁን ምንም ቦታ የለም።",
  myBookingsHeader: "🎫 <b>የእኔ ቦታዎች</b>",

  ticketTitle: "🎫 <b>ቲኬት / ቦታ</b>",
  ticketStatus: "ሁኔታ",
  ticketRoute: "መስመር",
  ticketDeparture: "መነሻ ጊዜ",
  ticketSeats: "ወንበሮች",
  ticketTotal: "ጠቅላላ",
  ticketId: "የቦታ መለያ",
  ticketLoadError: "ቲኬት መጫን አልተሳካም: {error}",
  ticketSaved: "ቦታ ተቀምጧል። ዝርዝሮች በመተግበሪያ ወይም ድር።",

  loginPromptCb:
    "የተጓዥ ስልክዎን እና OTP በ <code>/login +2519xxxxxxxx 123456</code> ይላኩ።",

  loadingPopular: "⏳ ታዋቂ መስመሮች በመጫን ላይ…",
  pickPopular: "<b>ታዋቂ መስመር</b> ይምረጡ ወይም ከተሞችን በእጅ ይምረጡ:",
  loadingCities: "⏳ ከተሞች በመጫን ላይ…",
  selectOrigin: "📍 <b>መነሻ</b> ከተማ ይምረጡ:",
  selectDest: "መነሻ: <b>{origin}</b>\n<b>መድረሻ</b> ይምረጡ:",
  routePickDay: "መስመር: <b>{origin}</b> → <b>{dest}</b>\nየጉዞ ቀን ይምረጡ:",
  arrowRoute: "<b>{origin}</b> → <b>{dest}</b>\nየጉዞ ቀን ይምረጡ:",
  searchingRoutes: "⏳ በመፈለግ <b>{origin}</b> → <b>{dest}</b> በ <code>{date}</code>…",
  noRoutes: "ለዚህ ግንኙነት መስመር የለም። ሌላ ከተማ ወይም ቀን ይሞክሩ።",
  selectRoute: "ኦፕሬተር / መስመር ይምረጡ:",
  loadingDepartures: "⏳ መነሻዎች በመጫን ላይ…",
  noDepartures: "በዚያ ቀን አውቶቡስ የለም። ሌላ መስመር ወይም ቀን ይምረጡ።",
  selectDeparture: "መነሻ ይምረጡ:",
  loadingSeats: "⏳ ወንበሮች በመጫን ላይ…",
  noSeats: "በዚህ አውቶቡስ ቦታ የለም።",
  seatHeader: "አውቶቡስ <b>{plate}</b> · {time}",
  seatPrice: "ዋጋ <b>{price} ብር</b> / ወንበር",
  seatSelected: "የተመረጡ: <b>{seats}</b>",
  seatNone: "የለም",
  seatHint: "ወንበሮችን ይንኩ፣ ከዚያ <b>እነዚህን ይያዙ</b>።",
  seatNotAvail: "ቦታ የለም",
  pickDifferentCity: "ሌላ ከተማ ይምረጡ",

  creatingBooking: "⏳ ቦታ በመፍጠር ላይ…",
  bookingCreated: "✅ <b>ቦታ ተፈጥሯል</b> (ክፍያ በመጠባበቅ ላይ)",
  bookingId: "መለያ",
  bookingSeats: "ወንበሮች",
  bookingTotal: "ጠቅላላ",
  choosePayment: "ክፍያ ይምረጡ:",

  skipPaid: "⏭ ዝለል (ከፍያ ካለፈ)",
  noBookingSession: "በዚህ ክፍለ ጊዜ የቅርብ ቦታ የለም።",
  noBookingPay: "ለመክፈል ቦታ የለም።",

  mpesaTitle: "<b>M-Pesa STK</b>",
  mpesaPhone: "የM-Pesa ስልክዎን ይላኩ (ለምሳሌ <code>2547…</code>)።",
  mpesaSame: "<b>same</b> በመፃፍ የተገናኘ ስልክ <code>{phone}</code> ይጠቀሙ።",
  mpesaStart: "⏳ M-Pesa በመጀመር ላይ…",
  mpesaMock: "✅ ክፍያ ተጠናቋል (dev/mock)። ቲኬትዎ:",
  mpesaPrompt:
    "📱 ለM-Pesa ጥያቄ ስልክዎን ይመልከቱ።\nማጣቀሻ: <code>{ref}</code>\n\nከከፈሉ <b>የእኔ ቦታዎች</b> ወይም /bookings።",
  invalidPhone: "ስልክ ትክክል አይደለም። እንደገና ይሞክሩ።",

  chapaEmail: "ለChapa ሊንክ ኢሜይልዎን ይላኩ።",
  chapaStart: "⏳ Chapa በመጀመር ላይ…",
  chapaMock: "✅ ክፍያ ተጠናቋል (dev/mock)። ቲኬትዎ:",
  chapaLink: "ክፍያ: {url}\nTx: <code>{ref}</code>",
  chapaFallback: "Chapa ተጀምሯል — ኢሜይል ወይም SMS ይመልከቱ።",
  invalidEmail: "ኢሜይል አይመስልም። እንደገና ይሞክሩ።",

  sessionExpired: "ክፍለ ጊዜ አልፏል። እንደገና ይፈልጉ።",
  cityNotFound: "ከተማ አልተገኘም። ፍለጋ ይጀምሩ።",
  cityNotFoundShort: "ከተማ አልተገኘም።",
  startSearchAgain: "ከሜኑ ፍለጋ ይጀምሩ።",
  routeUnavailable: "መስመር አይገኝም። /start → መረመር።",

  selectOneSeat: "ቢያንስ አንድ ወንበር ይምረጡ",
  cancelledShort: "ተቋርጧል።",

  languageSet: "✅ ቋንቋ ወደ <b>{label}</b> ተቀይሯል።",

  btn_search: "🔍 አውቶቡስ መረመር",
  btn_bookings: "🎫 የእኔ ቦታዎች",
  btn_login: "🔐 መግባት",
  btn_language: "🌐 ቋንቋ / Language",
  btn_mpesa: "M-Pesa",
  btn_chapa: "Chapa",
  btn_pick_cities: "📍 ከተሞች በእጅ",
  btn_book_seats: "✅ ይህን ይያዙ",
  btn_cancel: "❌ ሰርዝ",
  btn_today: "ዛሬ",
  btn_tomorrow: "ነገ",
  btn_plus2: "+2",
  btn_plus3: "+3",
  btn_plus4: "+4",
  btn_plus5: "+5",
  btn_plus6: "+6",
};

const om: Dict = {
  chooseLanguageTitle: "🌐 <b>Afaan keessan filadhaa</b>",
  chooseLanguageHint: "Menu irraa <b>Language / ቋንቋ</b> yeroo kamittuu jijjiiruu dandeessu.",

  welcomeTitle: "✨ <b>EthioTransit</b>",
  welcomeSub: "Geejjiba magaalaa gidduu — akka web fi app waliin akkaawuntii tokko.",
  welcomeBody: "Qabduu armaan gadii ykn <code>/login</code> booda <b>Barbaadi</b>.",

  helpTitle: "<b>Ajajoota</b>",
  helpStart: "/start — menyuu ijoo",
  helpLogin: "/login — akkaawuntii imalaa walitti hidhuu",
  helpBookings: "/bookings — imala keessan",
  helpCancel: "/cancel — barbaacha dhiisuu",

  cancelDone: "Haqame. Menyuu irraa irra deebi'aa jalqabi.",
  somethingWrong: "Dogoggorri uumame. /start ykn /cancel yaali.",

  needLoginTitle: "Dura seeni",
  needLoginBody:
    "Kana fayyadami:\n<code>/login +251900000000 123456</code>\n(bilbila, iddoo, OTP — dev API <code>AUTH_DEV_CODE</code>)",

  loginUsage: "Fayyadama: <code>/login +2519xxxxxxxx 123456</code>",
  loginSigning: "⏳ Seenaa jira…",
  loginPassengerOnly: "Boti kun <b>imalaaf</b> qofa. Bilbila imalaa fayyadami.",
  loginOk: "✅ Akka <code>{phone}</code> walitti hidhame. Barbachuufi galmaa dandeessa.",
  loginFailed: "Seenanni hin milkoofne: {error}",

  mainMenuLabel: "Menyuu ijoo",
  loadingBookings: "⏳ Galmaa fe'aa jira…",
  noBookings: "Amma ammatti galmaan hin jiru.",
  myBookingsHeader: "🎫 <b>Galmaa koo</b>",

  ticketTitle: "🎫 <b>Tiikkeetii / Galmaa</b>",
  ticketStatus: "Haala",
  ticketRoute: "Karaa",
  ticketDeparture: "Yeroo ba'uu",
  ticketSeats: "Teessoo",
  ticketTotal: "Waliigala",
  ticketId: "ID galmaa",
  ticketLoadError: "Tiikkeetii hin fe'amu: {error}",
  ticketSaved: "Galmiin olkaa'ame. App ykn web irratti bal'ina argadhu.",

  loginPromptCb:
    "Bilbila imalaa fi OTP <code>/login +2519xxxxxxxx 123456</code> ergi.",

  loadingPopular: "⏳ Karaalee beekamoo fe'aa jira…",
  pickPopular: "<b>Karaa beekamaa</b> filadhu ykn magaalota harkatti filadhu:",
  loadingCities: "⏳ Magaalota fe'aa jira…",
  selectOrigin: "📍 Magaalaa <b>ka'aa</b> filadhu:",
  selectDest: "Ka'aa: <b>{origin}</b>\n<b>Ga'uu</b> filadhu:",
  routePickDay: "Karaa: <b>{origin}</b> → <b>{dest}</b>\nGuyyaa imala filadhu:",
  arrowRoute: "<b>{origin}</b> → <b>{dest}</b>\nGuyyaa imala filadhu:",
  searchingRoutes: "⏳ Barbachaa jira <b>{origin}</b> → <b>{dest}</b> <code>{date}</code> irratti…",
  noRoutes: "Karaan walitti dhufeenya kanaaf hin jiru. Magaalaa ykn guyyaa biraa yaali.",
  selectRoute: "Oopireetara / karaa filadhu:",
  loadingDepartures: "⏳ Ba'uu fe'aa jira…",
  noDepartures: "Guyyaan sun konkolaataan hin jiru. Karaa ykn guyyaa biraa filadhu.",
  selectDeparture: "Ba'uu filadhu:",
  loadingSeats: "⏳ Teessoo fe'aa jira…",
  noSeats: "Teessoon konkolaataa kana irratti hin jiru.",
  seatHeader: "Konkolaataa <b>{plate}</b> · {time}",
  seatPrice: "Gatii <b>{price} ETB</b> / teessoo",
  seatSelected: "Filataman: <b>{seats}</b>",
  seatNone: "hin jiru",
  seatHint: "Teessoo cuqaasi, sana booda <b>Kun galchi</b>.",
  seatNotAvail: "Teessoon hin jiru",
  pickDifferentCity: "Magaalaa biraa filadhu",

  creatingBooking: "⏳ Galmaa uumaa jira…",
  bookingCreated: "✅ <b>Galmiin uumame</b> (kaffalti eegaa jira)",
  bookingId: "ID",
  bookingSeats: "Teessoo",
  bookingTotal: "Waliigala",
  choosePayment: "Kaffaltii filadhu:",

  skipPaid: "⏭ Darbi (duraan kaffaltan)",
  noBookingSession: "Galmaa dhiyoo sessiyoon keessatti hin jiru.",
  noBookingPay: "Kaffaltuuf galmaan hin jiru.",

  mpesaTitle: "<b>M-Pesa STK</b>",
  mpesaPhone: "Bilbila M-Pesa kee ergi (fakkeenya <code>2547…</code>).",
  mpesaSame: "<b>same</b> barreessi bilbila walitti hidhame <code>{phone}</code> fayyadami.",
  mpesaStart: "⏳ M-Pesa jalqachaa jira…",
  mpesaMock: "✅ Kaffalti xumurame (dev/mock). Tiikkeetii kee:",
  mpesaPrompt:
    "📱 Bilbila keessatti gaaffii M-Pesa ilaali.\nMallattoo: <code>{ref}</code>\n\nYeroo kaffaltan <b>Galmaa koo</b> ykn /bookings.",
  invalidPhone: "Bilbilni sirrii hin ta'u. Irra deebi'aa yaali.",

  chapaEmail: "Imeelii liinki Chapaaf ergi.",
  chapaStart: "⏳ Chapa jalqachaa jira…",
  chapaMock: "✅ Kaffalti xumurame (dev/mock). Tiikkeetii kee:",
  chapaLink: "As kaffali: {url}\nTx: <code>{ref}</code>",
  chapaFallback: "Chapa jalqame — imeelii ykn SMS ilaali.",
  invalidEmail: "Imeelii fakkaataa hin ta'u. Irra deebi'aa yaali.",

  sessionExpired: "Sessiyoon darbee. Irra deebi'aa barbaadi.",
  cityNotFound: "Magaalaa hin argamne. Barbaacha jalqabi.",
  cityNotFoundShort: "Magaalaa hin argamne.",
  startSearchAgain: "Menyuu irraa barbaacha jalqabi.",
  routeUnavailable: "Karaan hin jiru. /start → Barbaadi.",

  selectOneSeat: "Yoo xiqqaate teessoo tokko filadhu",
  cancelledShort: "Haqame.",

  languageSet: "✅ Afaan <b>{label}</b> ta'eera.",

  btn_search: "🔍 Konkolaataa barbaadi",
  btn_bookings: "🎫 Galmaa koo",
  btn_login: "🔐 Seeni / walitti hidhi",
  btn_language: "🌐 Afaan / Language",
  btn_mpesa: "M-Pesa",
  btn_chapa: "Chapa",
  btn_pick_cities: "📍 Magaalota harkatti",
  btn_book_seats: "✅ Kun galchi",
  btn_cancel: "❌ Haqi",
  btn_today: "Har'a",
  btn_tomorrow: "Boruu",
  btn_plus2: "+2",
  btn_plus3: "+3",
  btn_plus4: "+4",
  btn_plus5: "+5",
  btn_plus6: "+6",
};

export const DICTS: Record<BotLocale, Dict> = { en, am, om };

export const LOCALE_LABELS: Record<BotLocale, string> = {
  en: "English",
  am: "አማርኛ",
  om: "Afaan Oromoo",
};
