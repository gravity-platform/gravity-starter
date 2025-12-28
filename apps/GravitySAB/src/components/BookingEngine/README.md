# Booking Engine Component

Premium calendar-based appointment booking system for the sports clinic service sidebar.

## 📁 File Structure

```
BookingEngine/
├── BookingEngine.jsx          # Main component orchestrator
├── CalendarHeader.jsx         # Month/year display
├── DaySelector.jsx            # Horizontal day picker
├── TimeSlotGrid.jsx          # Available time slots
├── BookingConfirmation.jsx   # Final booking form
├── index.js                  # Exports
└── README.md                 # This file
```

## 🎨 Features

### ✨ Premium Design
- **Gradient backgrounds** - Subtle gradients for depth
- **Smooth animations** - Fade-in, scale, and slide transitions
- **Dark mode support** - Full dark mode styling
- **Responsive layout** - Adapts to sidebar width

### 📅 Calendar Features
- **Month navigation** - Navigate between months
- **Day selector** - Horizontal scrollable day picker
- **Today indicator** - Highlights current day
- **Available dates** - Shows next 30 days (excluding Sundays)

### ⏰ Time Slot Features
- **Grid layout** - 3-column responsive grid
- **Availability status** - Shows available/unavailable slots
- **Visual feedback** - Selected state with gradient
- **9 AM - 5 PM** - Default clinic hours (30-min intervals)

### 📝 Booking Confirmation
- **Two-step process** - Calendar selection → Details form
- **Contact form** - Name, email, phone, notes
- **Appointment summary** - Review before confirming
- **Form validation** - Required field validation
- **Loading states** - Submit button with spinner

## 🚀 Usage

### Basic Integration

```jsx
import { BookingEngine } from './components/BookingEngine';

function ServiceSidebar() {
  const handleBookingComplete = (bookingData) => {
    console.log('Booking confirmed:', bookingData);
    // Send to backend, show success message, etc.
  };

  return (
    <BookingEngine 
      service={activeService}
      onBookingComplete={handleBookingComplete}
    />
  );
}
```

### Props

**BookingEngine**
- `service` (object) - Service details (name, title, etc.)
- `onBookingComplete` (function) - Callback when booking is confirmed

### Booking Data Structure

```javascript
{
  service: "Customized Insoles & Orthoses",
  date: "Monday, October 7, 2025",
  time: "10:30",
  name: "John Doe",
  email: "john@example.com",
  phone: "+1 (555) 000-0000",
  notes: "First time visit"
}
```

## 🎯 User Flow

1. **Select Date** - User picks a day from horizontal calendar
2. **Select Time** - Available time slots appear
3. **Continue** - "Continue to Booking Details" button appears
4. **Fill Form** - User enters contact information
5. **Confirm** - Submit booking with all details

## 🎨 Customization

### Clinic Hours

```javascript
// In BookingEngine.jsx
const startHour = 9;  // Change to 8 for 8 AM start
const endHour = 17;   // Change to 18 for 6 PM end
```

### Time Intervals

```javascript
// In BookingEngine.jsx
for (let minute of [0, 30]) {  // Change to [0, 15, 30, 45] for 15-min slots
```

### Available Days

```javascript
// In BookingEngine.jsx
if (date.getDay() !== 0) {  // Currently excludes Sundays
  // Change to exclude weekends: date.getDay() !== 0 && date.getDay() !== 6
}
```

### Colors

```javascript
// Primary blue gradient
className="bg-gradient-to-r from-blue-600 to-blue-700"

// Change to green:
className="bg-gradient-to-r from-green-600 to-green-700"
```

### Grid Columns

```javascript
// In TimeSlotGrid.jsx
<div className="grid grid-cols-3 gap-3">  // Change to grid-cols-4 for 4 columns
```

## 🔌 Integration with Service Sidebar

### Replace Form with Booking Engine

```jsx
// In ServiceSidebarContainer.jsx
import { BookingEngine } from '../components/BookingEngine';

// Replace FormBuilder with BookingEngine
<BookingEngine 
  service={activeService}
  onBookingComplete={handleBookingComplete}
/>
```

### Dual-Width Layout

The component is designed to fit perfectly in the right side (55%) of the dual-width service sidebar:

```
┌──────────────┬──────────────┐
│              │              │
│   Service    │   Booking    │
│   Details    │   Engine     │
│   (45vw)     │   (55%)      │
│              │              │
└──────────────┴──────────────┘
```

## 🔄 State Management

The component manages its own state:
- `currentDate` - Currently displayed month
- `selectedDate` - User's selected date
- `selectedTime` - User's selected time slot
- `bookingStep` - 'calendar' or 'confirmation'
- `formData` - Contact form data

## 🎭 Animations

- **Fade in** - Time slots appear smoothly
- **Scale up** - Selected items scale to 105%
- **Slide in** - Content slides from bottom
- **Hover effects** - Smooth transitions on hover

## 📱 Responsive Design

- **Horizontal scroll** - Day selector scrolls on mobile
- **Grid layout** - Time slots adapt to screen size
- **Touch friendly** - Large tap targets (48px+)
- **Scrollbar styling** - Custom thin scrollbars

## 🔮 Future Enhancements

- [ ] Connect to real availability API
- [ ] Add recurring appointments
- [ ] Multiple service selection
- [ ] Calendar sync (Google, Apple)
- [ ] SMS/Email confirmations
- [ ] Cancellation/rescheduling
- [ ] Therapist selection
- [ ] Service duration options
- [ ] Payment integration
- [ ] Waitlist functionality

## 🐛 Debugging

```javascript
// Enable debug mode
console.log('[BookingEngine] Selected date:', selectedDate);
console.log('[BookingEngine] Available slots:', timeSlots);
console.log('[BookingEngine] Form data:', formData);
```

---

**Created:** 2025-10-05  
**Version:** 1.0.0  
**Design:** Premium sports clinic booking interface
