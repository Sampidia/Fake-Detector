# 🔧 Mobile Header Components - Complete Structure Guide

## 📋 Overview
This document details the structure and usage of all header components in the Fake Detector application. Each header serves different purposes and targets specific user experiences.

---

## 🎯 Header Components Map

### **1. Global MobileHeader Component**
- **File:** `src/components/ui/mobile-header.tsx`
- **Purpose:** Universal header used across all pages except dashboard
- **Usage:** Scan, Result, Contact, Home pages
- **Specialization:** Full navigation, brand consistency

### **2. Dashboard MobileHeader Component**
- **File:** `src/components/ui/mobile-header-dashboard.tsx`
- **Purpose:** Dashboard-specific header with personalized welcome
- **Usage:** Dashboard page only
- **Specialization:** User welcome message, dashboard-specific layout

### **3. Page Usage Matrix**
| Page | Header Component | Key Features |
|------|------------------|-------------|
| **Home (`/page.tsx`)** | Global MobileHeader | Brand-first, auth buttons |
| **Scan (`/scan/page.tsx`)** | Global MobileHeader | Upload-focused, clean UI |
| **Result (`/result/[id]/page.tsx`)** | Global MobileHeader | Result-specific, back navigation |
| **Contact (`/contact/page.tsx`)** | Global MobileHeader | Support-focused, contact CTA |
| **Dashboard (`/dashboard/page.tsx`)** | **Dashboard MobileHeader** | **Welcome message, personalized** |

---

## 🔍 Deep Component Structure Analysis

### **📱 Global MobileHeader Component Structure**

#### **Main Header Section**
```tsx
<header className="bg-white shadow-sm border-b relative">
  <div className="container mx-auto px-4 py-3">
    <div className="flex items-center justify-between">

      {/* LEFT SIDE - BRAND SECTION */}
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2">
          <Logo />  {/* Brand Logo */}
          <span className="text-lg font-bold text-gray-900">
            Fake Detector  {/* Brand Name */}
          </span>
        </Link>
      </div>

      {/* RIGHT SIDE - USER ACTIONS SECTION */}
      <div className="flex items-center gap-2">
        {/* USER POINTS DISPLAY */}
        {isAuthenticated && (
          <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-full">
            <Wallet className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold">
              {session.user?.pointsBalance || 0}
            </span>
            <span className="text-xs text-blue-600">pts</span>
          </div>
        )}

        {/* GOOGLE PROFILE AVATAR */}
        {isAuthenticated && session.user?.image && (
          <img
            src={session.user.image}
            alt={`${session.user.name}'s profile`}
            className="w-6 sm:w-8 h-6 sm:h-8 rounded-full border-2 border-blue-300 hover:border-blue-400 transition-colors"
            title={`Welcome, ${session.user.name}`}
          />
        )}

        {/* DASHBOARD BUTTON - DESKTOP ONLY */}
        {isAuthenticated && (
          <Link href="/dashboard">
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex h-8 px-2 text-xs"
            >
              <LayoutGrid className="w-3 h-3 mr-1" />
              Dashboard
            </Button>
          </Link>
        )}

        {/* HAMBURGER MENU BUTTON */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="h-8 w-8 p-0"
        >
          {isMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  </div>
</header>
```

#### **Mobile Menu Drawer Structure**
```tsx
{/* DRAWER CONTAINER */}
<div className={`fixed inset-0 z-50 bg-black bg-opacity-50 transition-opacity ${
  isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
}`}>
  <div className={`fixed top-0 right-0 h-full w-64 bg-white shadow-xl transform transition-transform ${
    isMenuOpen ? 'translate-x-0' : 'translate-x-full'
  }`}>
    <div className="p-6">

      {/* DRAWER HEADER WITH BRAND */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
            <Logo />
            <span className="text-base font-semibold text-gray-900">Fake Detector</span>
          </Link>
        </div>
        <Button onClick={() => setIsMenuOpen(false)}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* USER INFO SECTION */}
      {isAuthenticated ? (
        <div className="mb-6 p-3 bg-blue-50 rounded-lg">
          <div className="text-sm font-medium text-gray-900 mb-1">
            {session.user?.name || session.user?.email}
          </div>
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold">
              {session.user?.pointsBalance || 0} points
            </span>
          </div>
        </div>
      ) : null}

      {/* NAVIGATION LINKS */}
      <div className="space-y-2">
        {/* Conditional navigation based on authentication status */}
        {isAuthenticated ? (
          <>
            <Link href="/scan"><Button>Scan Product</Button></Link>
            <Link href="/dashboard"><Button>Dashboard</Button></Link>
            {/* Other authenticated routes */}
            <hr className="my-4 border-gray-200" />
            <Link href="/contact"><Button>Contact Us</Button></Link>
            <Button onClick={handleSignOut} className="text-red-600">
              Sign Out
            </Button>
          </>
        ) : (
          <Link href="/auth/signin"><Button>Sign In</Button></Link>
        )}
      </div>

      {/* BRAND FOOTER */}
      <div className="mt-8 pt-4 border-t border-gray-200 text-center">
        <div className="text-xs text-gray-500">
          Utilize <strong className="text-blue-400">NAFDAC</strong> Official Database
        </div>
      </div>
    </div>
  </div>
</div>
```

---

### **🎯 Dashboard MobileHeader Component Structure**

#### **Key Differences from Global Header**
```tsx
{/* DASHBOARD-SPECIFIC WELCOME MESSAGE */}
{isAuthenticated && (
  <span className="hidden sm:inline-block text-sm font-medium text-gray-900 truncate max-w-[120px]">
    Welcome, {session.user?.name || session.user?.email}!
  </span>
)}

// NOTE: Dashboard button replaced with welcome message
// Original dashboard button is removed since user is already on dashboard
```

#### **Layout Comparison:**

**Global Header (Other Pages):**
```
[Logo] Fake Detector → [Points] [Avatar] [Dashboard Button] [☰]
```

**Dashboard Header:**
```
[Logo] Fake Detector → [Points] [Avatar] [Welcome, Name!] [☰]
```

---

## 📊 Component Props & Configuration

### **MobileHeader Props**
```tsx
interface MobileHeaderProps {
  showDashboardButton?: boolean  // Default: true
  showSearchButton?: boolean     // Default: false
  showBackToHome?: boolean       // Default: false
}
```

#### **Prop Usage Examples:**
```tsx
// Default configuration
<MobileHeader />

// Contact page with back-to-home option
<MobileHeader showBackToHome={true} />

// Pages with search functionality
<MobileHeader showSearchButton={true} />
```

---

## 🎨 Responsive Design Breakdown

### **Mobile (< 640px)**
```
┌────────────────────────────────┐
│📺  FLAKE DETECTOR      █░░░░▓█│  ← w-6 avatar
├────────────────────────────────┤
│      User Info                  │
│🏠 Home                         │
│📷 Scan Product                │
│📊 Dashboard                    │
│🚪 Sign Out                     │
└────────────────────────────────┘
```

### **Tablet (640px - 1024px)**
```
┌────────────────────────────────────┐
│📺  FAKE DETECTOR      ░▓█░░░▓░░░█░│  ← w-6 sm:w-8 avatar
├────────────────────────────────────┤
│         Dashboard Button         │  ← Shows at sm:
│[Dashboard]                       │
├────────────────────────────────────┤
│         User Info                 │
└────────────────────────────────────┘
```

### **Desktop (> 1024px)**
```
┌─────────────────────────────────────────────┐
│📺  FAKE DETECTOR      ░░░▒░░░▓▓░░░██▓░░░░░░░│  ← Full size avatar
├─────────────────────────────────────────────┤
│                           [Dashboard]       │
├─────────────────────────────────────────────┤
│         User Info                          │
└─────────────────────────────────────────────┤
```

---

## 🔧 Implementation Patterns

### **Conditional Rendering Patterns**
```tsx
// Authentication-based rendering
{isAuthenticated && (
  // Show only for logged-in users
)}

// Screen size-based rendering
{className="hidden sm:flex"}      // Hide on mobile, show on small+
{className="block sm:hidden"}     // Show only on mobile
{className="sm:w-8"}             // Responsive sizing
```

### **OAuth Data Fallback Pattern**
```tsx
// Always provide meaningful content
{session.user?.name || session.user?.email}
{session.user?.image ? (
  <img src={session.user.image} alt="Profile" />
) : (
  <User className="w-6 h-6" />  // Fallback icon
)}
```

### **Responsive Text Sizing**
```tsx
{/* Mobile-first approach */}
<span className="text-sm sm:text-base lg:text-lg">
  {/* Scales up with screen size */}
</span>
```

---

## 🔄 State Management

### **Component State**
```tsx
const [isMenuOpen, setIsMenuOpen] = useState(false)  // Menu drawer toggle
```

### **Authentication State**
```tsx
const { data: session, status } = useSession()
const isAuthenticated = status === "authenticated"

// Dependent on NextAuth session state
```

### **Dynamic Content Based on Route**
```tsx
const { pathname } = useRouter()
// Different content based on current page
```

---

## 🎯 Usage Examples by Page

### **Home Page Implementation**
```tsx
// Clean, brand-focused header
<MobileHeader showBackToHome={false} />
```

### **Scan Page Implementation**
```tsx
// Clean scanning interface
<MobileHeader showSearchButton={false} />
```

### **Result Page Implementation**
```tsx
// Result-specific layout
<MobileHeader showDashboardButton={true} />
```

### **Contact Page Implementation**
```tsx
// Enhanced contact navigation
<MobileHeader showBackToHome={true} />
```

### **Dashboard Page Implementation**
```tsx
// Personalized welcome instead of dashboard button
import { MobileHeader } from "@/components/ui/mobile-header-dashboard"
<MobileHeader />
```

---

## 🔧 Maintenance & Extension Guidelines

### **Adding New Header Features**
1. **Check existing component structures**
2. **Maintain responsive design patterns**
3. **Use consistent conditional rendering**
4. **Document new props in interface**

### **Modifying Existing Features**
1. **Preserve authentication logic**
2. **Test on all screen sizes**
3. **Verify accessibility**
4. **Update this documentation**

### **Best Practices**
- ✅ **Consistent naming conventions**
- ✅ **Clear component separation**
- ✅ **Proper error handling**
- ✅ **Performance optimized**
- ✅ **Accessible markup**
- ✅ **Semantic HTML structure**

---

## 🚨 Important Notes

### **Global Header vs Dashboard Header**
- **Global header** used on most pages with dashboard button
- **Dashboard header** only used on dashboard with welcome message
- **Avoid mixing** unless explicitly designed for that purpose

### **Avatar Sizing Consistency**
- **Mobile:** `w-6 h-6` (24px)
- **Tablet:** `sm:w-8 sm:h-8` (32px)
- **Desktop:** Auto-scales with container

### **Points Display**
- **Always positioned** left of avatar
- **Consistent background** `bg-blue-50`
- **Responsive padding** `px-3 py-2`

---

## 📚 Reference Section

### **File Locations**
- Global Header: `src/components/ui/mobile-header.tsx`
- Dashboard Header: `src/components/ui/mobile-header-dashboard.tsx`
- Usage: Various page files import and use components

### **Related Components**
- `src/components/ui/logo.tsx` - Logo component
- `src/components/ui/button.tsx` - Button styling
- `src/components/ui/badge.tsx` - Badge components

### **Styling Dependencies**
- Tailwind CSS classes throughout
- Lucide React icons
- Custom color scheme (blue-*)
- Responsive design utilities

---

*This documentation should be updated whenever header components are modified or new features are added.*
