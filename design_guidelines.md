{
  "brand": {
    "name": "Kalakriti Admin",
    "personality": [
      "luxury",
      "calm",
      "gallery-like",
      "content-forward",
      "trustworthy",
      "Stripe-simple",
      "editorial"
    ],
    "north_star": "Stripe dashboard clarity × luxury art gallery calm. Cream canvas, dark-brown ink, restrained gold accents."
  },

  "design_tokens": {
    "color_system": {
      "notes": [
        "Light mode only for V1.",
        "Use Kalakriti palette as base: cream background, dark brown primary, gold accent.",
        "Gold is an accent (borders, icons, focus rings, small highlights) — not large fills.",
        "Avoid gradients except tiny decorative overlays (<20% viewport)."
      ],
      "css_variables": {
        ":root": {
          "--background": "36 33% 96%",
          "--foreground": "22 22% 16%",

          "--card": "36 33% 98%",
          "--card-foreground": "22 22% 16%",

          "--popover": "36 33% 98%",
          "--popover-foreground": "22 22% 16%",

          "--primary": "22 46% 12%",
          "--primary-foreground": "36 33% 97%",

          "--secondary": "28 18% 90%",
          "--secondary-foreground": "22 46% 12%",

          "--muted": "30 18% 92%",
          "--muted-foreground": "24 10% 38%",

          "--accent": "43 52% 54%",
          "--accent-foreground": "22 46% 12%",

          "--border": "28 16% 84%",
          "--input": "28 16% 84%",
          "--ring": "43 52% 54%",

          "--destructive": "6 72% 52%",
          "--destructive-foreground": "36 33% 97%",

          "--success": "145 42% 34%",
          "--success-foreground": "36 33% 97%",

          "--warning": "34 86% 45%",
          "--warning-foreground": "22 46% 12%",

          "--info": "205 64% 40%",
          "--info-foreground": "36 33% 97%",

          "--radius": "0.75rem",

          "--chart-1": "22 46% 12%",
          "--chart-2": "43 52% 54%",
          "--chart-3": "24 10% 38%",
          "--chart-4": "145 42% 34%",
          "--chart-5": "205 64% 40%"
        },
        "hex_reference": {
          "bg_cream": "#FAF6F0",
          "ink_brown": "#2C1810",
          "accent_gold": "#C9A84C",
          "muted_taupe": "#9C8878",
          "body_text": "#3D3530",
          "border_sand": "#E7DED3",
          "success_olive": "#2F6B4F",
          "warning_amber": "#C77C2E",
          "danger_oxide": "#C2413A",
          "info_ocean": "#2B6F7A"
        },
        "allowed_gradients": {
          "hero_decorative_only": [
            "radial-gradient(600px circle at 10% 0%, rgba(201,168,76,0.18), transparent 55%)",
            "radial-gradient(700px circle at 90% 10%, rgba(156,136,120,0.14), transparent 60%)"
          ],
          "rule": "Decorative overlays only; never behind dense tables/forms; keep under 20% viewport."
        }
      }
    },

    "typography": {
      "font_pairing": {
        "display": {
          "name": "EB Garamond",
          "google_fonts": "https://fonts.google.com/specimen/EB+Garamond",
          "usage": "Page titles, section headers, empty-state headlines, key numbers on dashboard"
        },
        "body": {
          "name": "Space Grotesk",
          "google_fonts": "https://fonts.google.com/specimen/Space+Grotesk",
          "usage": "UI labels, tables, forms, navigation"
        },
        "mono": {
          "name": "IBM Plex Mono",
          "google_fonts": "https://fonts.google.com/specimen/IBM+Plex+Mono",
          "usage": "Order IDs, coupon codes, tracking numbers"
        }
      },
      "tailwind_recommendation": {
        "add_to_index_css": [
          "body { font-family: 'Space Grotesk', ui-sans-serif, system-ui; }",
          "h1,h2,h3,.font-display { font-family: 'EB Garamond', ui-serif, Georgia; }",
          ".font-mono { font-family: 'IBM Plex Mono', ui-monospace, SFMono-Regular; }"
        ]
      },
      "type_scale": {
        "h1": "text-4xl sm:text-5xl lg:text-6xl font-display font-semibold tracking-[-0.02em] leading-[1.05]",
        "h2": "text-base md:text-lg font-medium text-muted-foreground leading-relaxed",
        "section_title": "text-xl md:text-2xl font-display font-semibold tracking-[-0.01em]",
        "card_title": "text-sm font-semibold tracking-[-0.01em]",
        "body": "text-sm md:text-base leading-relaxed",
        "small": "text-xs text-muted-foreground",
        "kpi_number": "text-2xl md:text-3xl font-display font-semibold tracking-[-0.02em]",
        "table": "text-sm",
        "code": "text-xs font-mono"
      }
    },

    "spacing": {
      "scale_px": {
        "0": 0,
        "1": 4,
        "2": 8,
        "3": 12,
        "4": 16,
        "5": 20,
        "6": 24,
        "8": 32,
        "10": 40,
        "12": 48,
        "16": 64,
        "20": 80,
        "24": 96
      },
      "layout_padding": {
        "page_x": "px-4 sm:px-6 lg:px-8",
        "page_y": "py-5 sm:py-6",
        "card": "p-4 sm:p-5",
        "form_section": "space-y-4",
        "dense_table_toolbar": "gap-2 sm:gap-3"
      }
    },

    "radii_shadows": {
      "radius": {
        "card": "rounded-xl",
        "input": "rounded-lg",
        "button": "rounded-lg",
        "chip": "rounded-full"
      },
      "shadow": {
        "card": "shadow-[0_1px_0_rgba(44,24,16,0.06),0_10px_30px_rgba(44,24,16,0.06)]",
        "popover": "shadow-[0_12px_40px_rgba(44,24,16,0.14)]",
        "focus_ring": "focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))]"
      },
      "borders": {
        "default": "border border-[hsl(var(--border))]",
        "hairline": "border border-[rgba(44,24,16,0.10)]"
      }
    }
  },

  "layout": {
    "grid": {
      "max_width": "max-w-[1400px]",
      "dashboard_columns": "grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5",
      "kpi_row": "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4",
      "content_split": "grid grid-cols-1 lg:grid-cols-12 gap-5",
      "order_detail": {
        "left": "lg:col-span-8",
        "right": "lg:col-span-4"
      }
    },
    "sidebar": {
      "width": "w-[280px]",
      "collapsed_width": "w-[76px]",
      "mobile": "Use Sheet (shadcn) for sidebar drawer",
      "nav_style": "Gallery label + grouped nav sections; active item uses subtle gold left border + taupe background"
    },
    "topbar": {
      "height": "h-14",
      "content": [
        "Breadcrumb",
        "Global search (Command)",
        "Quick actions (New coupon, Upload gallery)",
        "Avatar menu"
      ]
    },
    "page_background": {
      "base": "bg-[hsl(var(--background))]",
      "texture": "Add subtle noise overlay via CSS (see instructions_to_main_agent)"
    }
  },

  "components": {
    "component_path": {
      "button": "/app/frontend/src/components/ui/button.jsx",
      "card": "/app/frontend/src/components/ui/card.jsx",
      "badge": "/app/frontend/src/components/ui/badge.jsx",
      "table": "/app/frontend/src/components/ui/table.jsx",
      "input": "/app/frontend/src/components/ui/input.jsx",
      "textarea": "/app/frontend/src/components/ui/textarea.jsx",
      "select": "/app/frontend/src/components/ui/select.jsx",
      "switch": "/app/frontend/src/components/ui/switch.jsx",
      "checkbox": "/app/frontend/src/components/ui/checkbox.jsx",
      "dialog": "/app/frontend/src/components/ui/dialog.jsx",
      "alert_dialog": "/app/frontend/src/components/ui/alert-dialog.jsx",
      "sheet": "/app/frontend/src/components/ui/sheet.jsx",
      "dropdown_menu": "/app/frontend/src/components/ui/dropdown-menu.jsx",
      "tabs": "/app/frontend/src/components/ui/tabs.jsx",
      "calendar": "/app/frontend/src/components/ui/calendar.jsx",
      "popover": "/app/frontend/src/components/ui/popover.jsx",
      "tooltip": "/app/frontend/src/components/ui/tooltip.jsx",
      "scroll_area": "/app/frontend/src/components/ui/scroll-area.jsx",
      "separator": "/app/frontend/src/components/ui/separator.jsx",
      "sonner_toasts": "/app/frontend/src/components/ui/sonner.jsx",
      "skeleton": "/app/frontend/src/components/ui/skeleton.jsx",
      "command": "/app/frontend/src/components/ui/command.jsx",
      "breadcrumb": "/app/frontend/src/components/ui/breadcrumb.jsx",
      "pagination": "/app/frontend/src/components/ui/pagination.jsx"
    },

    "buttons": {
      "variants": {
        "primary": {
          "use": "Primary actions: Save changes, Ship with Shiprocket, Create coupon",
          "classes": "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/95 active:bg-[hsl(var(--primary))]/90",
          "motion": "transition-colors duration-150; active: translate-y-[1px]"
        },
        "secondary": {
          "use": "Secondary actions: Preview, Duplicate, Export",
          "classes": "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:bg-[hsl(var(--secondary))]/80",
          "motion": "transition-colors duration-150"
        },
        "ghost": {
          "use": "Toolbar actions, icon buttons",
          "classes": "hover:bg-[rgba(44,24,16,0.06)]",
          "motion": "transition-colors duration-150"
        },
        "destructive": {
          "use": "Delete testimonial, remove image",
          "classes": "bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] hover:bg-[hsl(var(--destructive))]/90",
          "motion": "transition-colors duration-150"
        },
        "icon": {
          "use": "Compact icon-only actions",
          "classes": "h-9 w-9 p-0 rounded-lg",
          "motion": "hover:shadow-[0_1px_0_rgba(44,24,16,0.08)]"
        }
      },
      "sizes": {
        "sm": "h-9 px-3 text-sm",
        "md": "h-10 px-4 text-sm",
        "lg": "h-11 px-5 text-base"
      },
      "testing": {
        "rule": "All buttons must include data-testid",
        "examples": [
          "data-testid=\"orders-filter-apply-button\"",
          "data-testid=\"order-detail-shiprocket-button\"",
          "data-testid=\"medium-editor-save-button\""
        ]
      }
    },

    "sidebar_navigation": {
      "structure": {
        "header": "Kalakriti Admin (wordmark) + small gold dot accent",
        "sections": [
          "Overview",
          "Commerce",
          "Content",
          "System"
        ],
        "items": [
          "Dashboard",
          "Orders",
          "Mediums",
          "Gallery",
          "Testimonials",
          "Content",
          "Coupons",
          "Settings",
          "Analytics"
        ]
      },
      "interaction": {
        "active": "bg-[rgba(156,136,120,0.14)] text-[hsl(var(--primary))] border-l-2 border-l-[hsl(var(--accent))]",
        "hover": "hover:bg-[rgba(44,24,16,0.05)]",
        "focus": "Use focus-visible ring on nav buttons",
        "collapsed": "Icons only + tooltip"
      },
      "mobile": "Use Sheet with overlay; close on navigation"
    },

    "topbar_search": {
      "component": "Command",
      "pattern": "Cmd+K opens global search",
      "classes": "bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg",
      "data_testid": "topbar-global-search"
    },

    "stat_cards": {
      "component": "Card",
      "layout": "Title row (label + icon) then KPI number then delta chip",
      "classes": "bg-[hsl(var(--card))] border border-[rgba(44,24,16,0.10)] rounded-xl",
      "micro_interaction": "On hover: border becomes slightly darker + subtle lift shadow (no transform transitions globally; only shadow/border)"
    },

    "data_tables": {
      "component": "Table + ScrollArea",
      "toolbar": {
        "left": [
          "Search Input",
          "Status Select",
          "Medium Select",
          "Date range (Popover + Calendar)"
        ],
        "right": [
          "Export",
          "Bulk actions",
          "Pagination"
        ]
      },
      "table_style": {
        "header": "text-xs uppercase tracking-wide text-muted-foreground",
        "row_hover": "hover:bg-[rgba(44,24,16,0.03)]",
        "zebra_optional": "odd:bg-[rgba(250,246,240,0.55)]",
        "sticky_header": "Use CSS sticky top-0 on thead inside ScrollArea"
      },
      "status_chips": {
        "use": "Badge",
        "mapping": {
          "new": "bg-[rgba(201,168,76,0.18)] text-[hsl(var(--primary))] border border-[rgba(201,168,76,0.35)]",
          "in_progress": "bg-[rgba(43,111,122,0.12)] text-[hsl(var(--info))] border border-[rgba(43,111,122,0.25)]",
          "awaiting_reference": "bg-[rgba(156,136,120,0.14)] text-[hsl(var(--primary))] border border-[rgba(156,136,120,0.25)]",
          "ready_to_ship": "bg-[rgba(47,107,79,0.12)] text-[hsl(var(--success))] border border-[rgba(47,107,79,0.25)]",
          "shipped": "bg-[rgba(47,107,79,0.18)] text-[hsl(var(--success))] border border-[rgba(47,107,79,0.30)]",
          "cancelled": "bg-[rgba(194,65,58,0.12)] text-[hsl(var(--destructive))] border border-[rgba(194,65,58,0.25)]"
        },
        "data_testid_example": "orders-table-status-chip"
      }
    },

    "forms": {
      "inputs": {
        "component": "Input",
        "classes": "bg-[hsl(var(--card))] border-[rgba(44,24,16,0.14)] focus-visible:ring-[hsl(var(--ring))]",
        "helper_text": "Use small muted text under fields; errors in destructive"
      },
      "selects": {
        "component": "Select",
        "notes": "Use for status, medium, badge type"
      },
      "toggles": {
        "component": "Switch",
        "use": "Featured toggle, Rush enabled"
      },
      "file_upload": {
        "pattern": "Dropzone-like card (custom) + hidden input",
        "classes": "border border-dashed border-[rgba(44,24,16,0.22)] rounded-xl bg-[rgba(250,246,240,0.6)]",
        "micro_interaction": "On drag over: border accent gold + background slightly warmer",
        "data_testid": "file-upload-dropzone"
      }
    },

    "modals_drawers": {
      "component": "Dialog for confirmations; Sheet for mobile detail panels",
      "style": "Rounded-xl, warm shadow, no harsh overlays (overlay opacity ~0.35)"
    },

    "timeline_order_status": {
      "build": "Custom component using Separator + Badge + small dots",
      "visual": "Vertical timeline with gold dot for current step; muted taupe for future; success green for completed",
      "steps": [
        "New",
        "Reference Received",
        "Sketch Approved",
        "In Progress",
        "Ready to Ship",
        "Shipped"
      ],
      "data_testid": "order-status-timeline"
    },

    "image_gallery_cards": {
      "components": [
        "Card",
        "AspectRatio",
        "Carousel (optional for reference photos)",
        "Dialog (lightbox)"
      ],
      "style": "Cream canvas background, thin border, hover reveals actions (View, Download, Remove)",
      "actions": "Use ghost icon buttons with tooltip",
      "data_testid": "order-reference-photo"
    },

    "charts": {
      "library": "recharts",
      "style": {
        "grid": "stroke rgba(44,24,16,0.10)",
        "axis": "tick fill rgba(61,53,48,0.75)",
        "line": "stroke hsl(var(--primary)) strokeWidth 2",
        "area_fill": "fill rgba(201,168,76,0.18)",
        "tooltip": "Use shadcn Card-like tooltip container"
      },
      "data_testid_examples": [
        "analytics-revenue-line-chart",
        "dashboard-status-funnel-bar-chart"
      ]
    },

    "empty_states": {
      "tone": "Warm, reassuring, craft-focused. Short sentences. No emojis.",
      "pattern": "Card with illustration thumbnail + headline (serif) + 1 line guidance + primary CTA",
      "examples": {
        "orders": {
          "headline": "No orders yet",
          "body": "When a customer places an order, it will appear here with reference photos and status.",
          "cta": "Refresh"
        },
        "gallery": {
          "headline": "Your gallery is empty",
          "body": "Upload before/after pairs to build trust on the storefront.",
          "cta": "Upload images"
        },
        "coupons": {
          "headline": "No coupons created",
          "body": "Create a code for seasonal offers or returning customers.",
          "cta": "Create coupon"
        }
      }
    }
  },

  "page_guidance": {
    "login": {
      "layout": "Split screen on desktop: left brand panel (cream + subtle noise + small decorative radial), right login card. On mobile: single column with brand header.",
      "left_panel": {
        "content": [
          "Kalakriti wordmark",
          "Short line: 'Manage commissions, content, and shipping — calmly.'",
          "1–2 trust bullets: 'Secure admin access', 'Fast order updates'"
        ]
      },
      "login_card": {
        "fields": [
          "Email",
          "Password"
        ],
        "cta": "Sign in",
        "data_testids": {
          "email": "login-email-input",
          "password": "login-password-input",
          "submit": "login-submit-button"
        }
      }
    },

    "dashboard": {
      "above_fold": "KPI row (4 cards) + recent orders table preview",
      "below_fold": "Revenue line chart + status funnel bar + orders by medium pie",
      "notes": "Keep charts in Cards; avoid heavy gradients; use gold only as highlight"
    },

    "orders_list": {
      "table": "Dense but breathable: 44–48px row height, sticky header, right-aligned totals",
      "filters": "Search + status + medium + date range; persist in URL query params",
      "data_testids": {
        "search": "orders-search-input",
        "status": "orders-status-select",
        "medium": "orders-medium-select"
      }
    },

    "order_detail": {
      "layout": "Two-column on desktop: left (timeline + reference gallery + notes), right (customer + pricing + ship action).",
      "shiprocket_cta": "Primary button with truck icon; show loading state + toast on success/failure",
      "reference_photos": "Grid 2-up on mobile, 3-up on desktop; click opens Dialog lightbox"
    },

    "mediums": {
      "layout": "4-card grid; each card shows hero image, base price, turnaround, badge",
      "edit": "Edit opens /mediums/:id with form sections and sticky Save bar"
    },

    "medium_editor": {
      "pattern": "Long form broken into Cards: Basics, Pricing, Sizes, Images, Badge. Use Tabs for Pricing vs Sizes if needed.",
      "sticky_save_bar": "Bottom sticky bar with Save + Preview; subtle border top"
    },

    "gallery_manager": {
      "pattern": "Grid of before/after pairs; drag-to-reorder (optional later).",
      "upload": "Top toolbar Upload button + dropzone card",
      "featured": "Switch toggle on each card"
    },

    "content_cms": {
      "pattern": "Accordion sections: Hero, Stats, Process Steps, CTA copy",
      "preview": "Secondary button 'Preview storefront' opens new tab"
    },

    "analytics": {
      "pattern": "Tabs: Revenue, Orders, Funnel. Each tab has 1 hero chart + 2 small charts.",
      "export": "Export CSV button in top-right"
    }
  },

  "micro_interactions_motion": {
    "principles": [
      "Subtle, professional. Prefer color/border/shadow transitions over transforms.",
      "No universal transition: never transition: all.",
      "Respect prefers-reduced-motion."
    ],
    "hover": {
      "cards": "transition-shadow duration-200; hover:shadow-[0_1px_0_rgba(44,24,16,0.08),0_14px_40px_rgba(44,24,16,0.08)]",
      "rows": "transition-colors duration-150",
      "buttons": "transition-colors duration-150; active: translate-y-[1px] (only on buttons)"
    },
    "loading": {
      "tables": "Skeleton rows",
      "buttons": "Inline spinner + disabled state",
      "toasts": "Use Sonner for success/error"
    }
  },

  "accessibility": {
    "requirements": [
      "WCAG AA contrast for text on cream backgrounds.",
      "Visible focus states using ring token.",
      "Keyboard navigable sidebar + command palette.",
      "Use aria-label for icon-only buttons.",
      "Use alt text for uploaded images (fallback: 'Reference photo')."
    ]
  },

  "image_urls": {
    "usage_notes": [
      "Use images sparingly in admin; prioritize performance.",
      "Prefer local uploads for real content; use these only for empty states/login brand panel placeholders."
    ],
    "placeholders": [
      {
        "category": "login-left-panel",
        "description": "Soft studio tools photo for brand mood (blurred + low opacity overlay)",
        "url": "https://images.unsplash.com/photo-1708570735809-8a3bbc0ce0de?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1NzZ8MHwxfHNlYXJjaHwzfHxhcnRpc3QlMjBzdHVkaW8lMjBwYWludGluZ3xlbnwwfHx8d2hpdGV8MTc3NzYyNTMzNHww&ixlib=rb-4.1.0&q=85"
      }
    ]
  },

  "instructions_to_main_agent": {
    "global_css_updates": [
      "Update /app/frontend/src/index.css : replace default :root tokens with the HSL tokens above (cream/brown/gold). Keep .dark tokens unused for V1.",
      "Remove CRA demo styles in /app/frontend/src/App.css (logo spin, centered header). Ensure no .App { text-align:center } is introduced.",
      "Add subtle noise overlay utility: create a .noise-bg class using a tiny SVG noise data-uri or repeating-radial-gradient; apply to page background only (not cards).",
      "Add font imports in public/index.html or via CSS @import for EB Garamond, Space Grotesk, IBM Plex Mono."
    ],
    "component_build_notes_js": [
      "This repo uses .js/.jsx shadcn components. Create new components as .jsx and keep named exports for components.",
      "Pages should default export.",
      "Use lucide-react icons only.",
      "All interactive and key informational elements MUST include data-testid (kebab-case)."
    ],
    "admin_panel_architecture": [
      "Frontend: React Router routes for /login, /dashboard, /orders, /orders/:id, /mediums, /mediums/:id, /gallery, /testimonials, /content, /coupons, /settings, /analytics.",
      "Backend: FastAPI + MongoDB. Use JWT auth (httpOnly cookie preferred) for single-admin login.",
      "Connect to existing Next.js storefront: store content/mediums/prices/gallery/testimonials in MongoDB; Next.js reads via public API endpoints or server-side fetch with caching.",
      "Orders: if storefront uses a payment provider, store order IDs and status in MongoDB; admin updates status; storefront order tracking reads status.",
      "Shiprocket: store API credentials in backend env; admin triggers shipment creation via backend endpoint; persist AWB/tracking in order record."
    ],
    "testing": {
      "rule": "Add data-testid to: sidebar nav links, topbar search, filters, table rows/actions, save buttons, dialogs confirm buttons, status chips, charts containers, empty-state CTAs."
    }
  },

  "appendix_general_ui_ux_design_guidelines": "<General UI UX Design Guidelines>  \n    - You must **not** apply universal transition. Eg: `transition: all`. This results in breaking transforms. Always add transitions for specific interactive elements like button, input excluding transforms\n    - You must **not** center align the app container, ie do not add `.App { text-align: center; }` in the css file. This disrupts the human natural reading flow of text\n   - NEVER: use AI assistant Emoji characters like`🤖🧠💭💡🔮🎯📚🎭🎬🎪🎉🎊🎁🎀🎂🍰🎈🎨🎰💰💵💳🏦💎🪙💸🤑📊📈📉💹🔢🏆🥇 etc for icons. Always use **FontAwesome cdn** or **lucid-react** library already installed in the package.json\n\n **GRADIENT RESTRICTION RULE**\nNEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.  Prohibited gradients: blue-500 to purple 600, purple 500 to pink-500, green-500 to blue-500, red to pink etc\nNEVER use dark gradients for logo, testimonial, footer etc\nNEVER let gradients cover more than 20% of the viewport.\nNEVER apply gradients to text-heavy content or reading areas.\nNEVER use gradients on small UI elements (<100px width).\nNEVER stack multiple gradient layers in the same viewport.\n\n**ENFORCEMENT RULE:**\n    • Id gradient area exceeds 20% of viewport OR affects readability, **THEN** use solid colors\n\n**How and where to use:**\n   • Section backgrounds (not content backgrounds)\n   • Hero section header content. Eg: dark to light to dark color\n   • Decorative overlays and accent elements only\n   • Hero section with 2-3 mild color\n   • Gradients creation can be done for any angle say horizontal, vertical or diagonal\n\n- For AI chat, voice application, **do not use purple color. Use color like light green, ocean blue, peach orange etc**\n\n</Font Guidelines>\n\n- Every interaction needs micro-animations - hover states, transitions, parallax effects, and entrance animations. Static = dead. \n   \n- Use 2-3x more spacing than feels comfortable. Cramped designs look cheap.\n\n- Subtle grain textures, noise overlays, custom cursors, selection states, and loading animations: separates good from extraordinary.\n   \n- Before generating UI, infer the visual style from the problem statement (palette, contrast, mood, motion) and immediately instantiate it by setting global design tokens (primary, secondary/accent, background, foreground, ring, state colors), rather than relying on any library defaults. Don't make the background dark as a default step, always understand problem first and define colors accordingly\n    Eg: - if it implies playful/energetic, choose a colorful scheme\n           - if it implies monochrome/minimal, choose a black–white/neutral scheme\n\n**Component Reuse:**\n\t- Prioritize using pre-existing components from src/components/ui when applicable\n\t- Create new components that match the style and conventions of existing components when needed\n\t- Examine existing components to understand the project's component patterns before creating new ones\n\n**IMPORTANT**: Do not use HTML based component like dropdown, calendar, toast etc. You **MUST** always use `/app/frontend/src/components/ui/ ` only as a primary components as these are modern and stylish component\n\n**Best Practices:**\n\t- Use Shadcn/UI as the primary component library for consistency and accessibility\n\t- Import path: ./components/[component-name]\n\n**Export Conventions:**\n\t- Components MUST use named exports (export const ComponentName = ...)\n\t- Pages MUST use default exports (export default function PageName() {...})\n\n**Toasts:**\n  - Use `sonner` for toasts\"\n  - Sonner component are located in `/app/src/components/ui/sonner.tsx`\n\nUse 2–4 color gradients, subtle textures/noise overlays, or CSS-based noise to avoid flat visuals.\n</General UI UX Design Guidelines>"
}
