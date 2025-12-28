# ProductDrawer Component

Sliding drawer system for SAB bank product applications (credit cards, loans, accounts).

## 📁 File Structure

```
ProductDrawer/
├── ProductDrawer.jsx           # Main drawer container (sliding panel)
├── ProductDetails.jsx          # Initial slide - product info display
├── ProductApplicationForm.jsx  # Full slide - multi-step application
├── steps/
│   ├── PersonalDetailsStep.jsx   # Step 1: Personal information
│   ├── EmploymentDetailsStep.jsx # Step 2: Employment & income
│   └── ApplicationReview.jsx     # Step 3: Review & submit
├── index.js                    # Exports
└── README.md                   # This file
```

## 🎨 Features

### ✨ Drawer Behavior

- **Initial slide (480px)**: Product details with benefits, features, rates
- **Full slide (1000px)**: Side-by-side product info + application form
- **Smooth animations**: Slide-in/out with backdrop
- **Responsive**: Stacks on mobile, side-by-side on desktop
- **Escape key**: Close drawer with keyboard

### 📋 Product Details

- Tier-based gradient headers (Infinite, Signature, Platinum, Gold, etc.)
- Product image display
- Key benefits with checkmarks
- Features as tags
- Rewards program info
- Rates & fees section
- "Apply Now" CTA button

### 📝 Application Form (3 Steps)

**Step 1: Personal Details**

- Full name (as per Emirates ID)
- Email address
- Mobile number
- Emirates ID
- Date of birth
- Nationality

**Step 2: Employment Details**

- Employment status (employed, self-employed, business owner, etc.)
- Employer/business name (conditional)
- Job title (conditional)
- Years in current role (conditional)
- Monthly income range

**Step 3: Review & Submit**

- Product summary
- Personal details review
- Employment details review
- Terms & conditions checkbox
- Submit button with loading state

## 🚀 Usage

### Basic Integration

```jsx
import { ProductDrawer } from "./components/ProductDrawer";
import { useProductDrawer } from "../hooks/useProductDrawer";

function App() {
  const { drawerOpen, activeProduct, closeDrawer, handleApply } = useProductDrawer();

  return (
    <>
      {/* Your app content */}

      <ProductDrawer isOpen={drawerOpen} product={activeProduct} onClose={closeDrawer} onApply={handleApply} />
    </>
  );
}
```

### Opening Programmatically

```jsx
const { openDrawer } = useProductDrawer();

// Open with a product object
openDrawer({
  title: "Infinite Credit Card",
  tier: "INFINITE",
  description: "Premium card with exclusive benefits",
  key_benefits: ["Airport lounge access", "Concierge service"],
  features: ["Contactless", "Apple Pay"],
  rewards: { program: "TouchPoints", welcome_bonus: "50,000 points" },
});
```

### Via CustomEvent

```javascript
// Dispatch from any component
window.dispatchEvent(
  new CustomEvent("gravity:product", {
    detail: {
      type: "click",
      data: { object: productData },
    },
  })
);
```

## 📊 Product Data Structure

```javascript
{
  // Required
  title: "Infinite Credit Card",

  // Optional
  name: "Infinite Card",           // Fallback for title
  tier: "INFINITE",                // INFINITE, SIGNATURE, PLATINUM, GOLD, TITANIUM, PREMIUM, STANDARD
  description: "Premium card...",
  imageUrl: "https://...",

  // Arrays
  key_benefits: [
    "Unlimited airport lounge access",
    "24/7 concierge service",
    "Travel insurance"
  ],
  features: [
    "Contactless",
    "Apple Pay",
    "Samsung Pay"
  ],

  // Objects
  rewards: {
    program: "TouchPoints",
    welcome_bonus: "50,000 points"
  },
  rates: {
    apr: "2.99%",
    display: "From 2.99% APR"
  },

  // Metadata (from dictionary)
  metadata: {
    shortDescription: "...",
    images: ["url1", "url2"]
  }
}
```

## 🎯 User Flow

```
1. User clicks product card
   ↓
2. ProductDrawer opens (480px)
   ↓
3. ProductDetails shows (benefits, features, rates)
   ↓
4. User clicks "Apply Now"
   ↓
5. Drawer expands to 1000px (side-by-side)
   ↓
6. Step 1: Personal Details form
   ↓
7. Step 2: Employment Details form
   ↓
8. Step 3: Review & Submit
   ↓
9. Application submitted
   ↓
10. onComplete callback fires
```

## 🎨 Customization

### Tier Gradients

```javascript
// In ProductDetails.jsx
const tierGradients = {
  INFINITE: "from-slate-800 to-black",
  SIGNATURE: "from-purple-600 to-indigo-800",
  PLATINUM: "from-gray-500 to-gray-700",
  GOLD: "from-yellow-500 to-amber-600",
  // Add custom tiers...
};
```

### Income Ranges

```javascript
// In EmploymentDetailsStep.jsx
<option value="5000-10000">AED 5,000 - 10,000</option>
<option value="10000-20000">AED 10,000 - 20,000</option>
// Modify ranges as needed...
```

### Panel Widths

```javascript
// In ProductDrawer.jsx
const panelWidth = showApplication
  ? "min(1000px, 95vw)" // Full slide
  : "min(480px, 90vw)"; // Initial slide
```

## 🔌 Integration with Chat

The drawer listens for `gravity:action` events with `object_type: "product"`:

```jsx
// In your card component
const handleClick = () => {
  window.dispatchEvent(
    new CustomEvent("gravity:action", {
      detail: {
        type: "click",
        data: { object: { ...productData, object_type: "product" } },
      },
    })
  );
};
```

## 🔄 State Management

The drawer manages its own state:

- `isVisible` - Whether drawer is in DOM
- `isAnimating` - Animation state for transitions
- `showApplication` - Whether to show application form
- `currentStep` - Current step in application (1-3)
- `formData` - Collected form data across steps

## 🎭 Animations

- **Backdrop**: Fade in/out (300ms)
- **Panel**: Slide from right (300ms ease-out)
- **Width expansion**: Smooth transition when application opens
- **Step indicator**: Animated progress dots

## 📱 Responsive Design

- **Desktop (≥768px)**: Side-by-side panels (480px + 520px)
- **Mobile (<768px)**: Single panel (90vw max), stacked views
- **Touch friendly**: Large tap targets, scrollable content

---

**Created:** 2025-12-07  
**Version:** 1.0.0  
**Design:** SAB Bank product application interface
