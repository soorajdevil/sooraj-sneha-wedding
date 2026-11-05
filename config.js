/* =========================================================
   EDIT EVERYTHING HERE — names, date, venue, photos, music.
   ========================================================= */
window.WEDDING = {
  groom: "Sooraj",
  bride: "Sneha",

  // Optional dark floral/photo backdrop for the envelope intro screen, e.g. "images/intro.jpg"
  introPhoto: "",

  // Wedding date & time in local time (ISO, with IST offset)
  datetime: "2026-12-12T12:15:00+05:30",
  muhurtham: "12:15 PM onwards",
  dateTimeText: "Saturday, 12 December 2026 • 10:30 AM onwards",

  venueName: "Eben Ezer Park Auditorium",
  venueShort: "Eben Ezer Park Auditorium, Punalur, Kerala",
  venueArea: "Pineapple Junction, Punalur, Kerala",
  address: "Eben Ezer Park Auditorium, Pineapple Junction, Punalur, Kerala",
  parking: "Ample parking space available.",
  mapsLink: "https://www.google.com/maps/search/?api=1&query=Eben+Ezer+Park+Auditorium+Pineapple+Junction+Punalur+Kerala",
  // Original share link: https://maps.app.goo.gl/Hx7tC5eZJJ3iYK1FA
  // Text used for the embedded map (venue name + town works well)
  mapQuery: "Eben Ezer Park Auditorium, Pineapple Junction, Punalur, Kerala",

  heroQuote: "“Two lives, two hearts, joined together in friendship, united forever in love.”",
  ceremonyNote: "Traditional Muhurtham & Blessings",

  story1: "Somewhere between ordinary days and unforgettable conversations, we found something extraordinary. What started as a beautiful connection grew into a promise to walk through every season of life together.",
  story2: "Now, surrounded by our family and dear friends, we step forward into our greatest adventure yet.",

  // Story photo (leave "" for a monogram placeholder)
  storyPhoto: "images/snehasooraj.webp",

  // Gallery: put images in /images and list them here. Empty src = placeholder tile.
  gallery: [
    { src: "", caption: "Together in Love" },
    { src: "", caption: "A Thousand Words in Every Glance" },
    { src: "", caption: "Joy, Laughter & Playful Smiles" },
    { src: "", caption: "Steps to Forever — Temple Blessings" },
    { src: "", caption: "Entwined Hands — Holding Onto Forever" },
    { src: "", caption: "A Ring, A Promise & Endless Tomorrow" },
  ],

  // Guest wishes: paste your deployed Google Apps Script web-app URL (see google-apps-script.gs).
  // Leave "" to run in demo mode (wishes are saved only in the visitor's own browser).
  wishesUrl: "/api/wishes",

  // Optional background music, e.g. "music/song.mp3" (plays after envelope opens)
  music: "",
};
