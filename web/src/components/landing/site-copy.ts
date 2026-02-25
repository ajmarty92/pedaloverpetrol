export const copy = {
  brand: "PedalOverPetrol",
  tagline: "Fast, Reliable Courier\nService in London",
  subtitle:
    "Same-day and scheduled bicycle delivery for businesses that value speed, reliability, and sustainability.",
  heroCta: "Get a Quote",
  heroSecondaryCta: "Track a Delivery",

  trustBadges: [
    { icon: "zap", text: "Same-day delivery" },
    { icon: "map-pin", text: "Real-time tracking" },
    { icon: "shield-check", text: "Proof of delivery" },
    { icon: "building", text: "Business accounts" },
  ],

  howItWorks: {
    heading: "How It Works",
    subtitle: "Three simple steps from booking to delivery.",
    steps: [
      {
        number: "1",
        title: "Book",
        description:
          "Tell us the pickup and drop-off addresses, package details, and preferred time window.",
      },
      {
        number: "2",
        title: "We Pick Up",
        description:
          "A courier is assigned and heads to the pickup location. Track them in real time.",
      },
      {
        number: "3",
        title: "We Deliver",
        description:
          "Your package is delivered with photo proof and a digital signature. Done.",
      },
    ],
  },

  features: {
    heading: "Built for Business",
    subtitle: "Everything you need to manage deliveries at scale.",
    items: [
      {
        icon: "map-pin",
        title: "Live Tracking",
        description:
          "Share a tracking link with your customers so they always know where their package is.",
      },
      {
        icon: "camera",
        title: "Proof of Delivery",
        description:
          "Every delivery includes a photo, recipient signature, and GPS timestamp.",
      },
      {
        icon: "bar-chart-3",
        title: "Analytics Dashboard",
        description:
          "Monitor delivery performance, on-time rates, and driver efficiency in real time.",
      },
      {
        icon: "credit-card",
        title: "Online Payments",
        description:
          "Customers can pay invoices online. Stripe integration with automatic reconciliation.",
      },
      {
        icon: "route",
        title: "Route Optimization",
        description:
          "Automatically sequence multi-stop routes to minimize travel time and distance.",
      },
      {
        icon: "users",
        title: "Customer Portal",
        description:
          "Give your customers a self-service portal to view jobs, download invoices, and track deliveries.",
      },
    ],
  },

  testimonials: {
    heading: "Trusted by London Businesses",
    items: [
      {
        quote:
          "PedalOverPetrol transformed our same-day delivery operations. Our customers love the live tracking links.",
        author: "Sarah M.",
        company: "Brick & Mortar Coffee",
      },
      {
        quote:
          "Reliable, fast, and the proof of delivery feature gives us peace of mind with every legal document we send.",
        author: "David O.",
        company: "Thames Valley Legal",
      },
      {
        quote:
          "The analytics dashboard lets us see exactly how our deliveries are performing. Couldn't go back.",
        author: "Priya S.",
        company: "GreenLeaf Organics",
      },
    ],
  },

  pricing: {
    heading: "Simple, Transparent Pricing",
    subtitle: "No hidden fees. No subscriptions. Pay per delivery.",
    startingAt: "5.00",
    perMile: "1.50",
    note: "Exact pricing depends on distance, package size, and time window. Get an instant quote below.",
  },

  footer: {
    copyright: `© ${new Date().getFullYear()} PedalOverPetrol. All rights reserved.`,
    tagline: "Bicycle courier delivery for London businesses.",
  },
} as const;
