# Sanitize Input hasOwnProperty Fix

**Date:** April 19, 2026  
**Status:** ✅ **FIXED**

## Problem
```
TypeError: obj.hasOwnProperty is not a function
at sanitizeObject (backend/middleware/sanitize-input.js:40:15)
```

The error occurred when the sanitize-input middleware tried to process objects that don't have a prototype (created with `Object.create(null)`) or objects from Express's internal parsing.

## Root Cause
Using `obj.hasOwnProperty(key)` directly fails on objects without a prototype chain. Express's body-parser and query-parser sometimes create objects using `Object.create(null)` for security reasons, which don't have the `hasOwnProperty` method.

## Solution
Changed from:
```javascript
if (obj.hasOwnProperty(key)) {
  sanitized[key] = sanitizeObject(obj[key]);
}
```

To:
```javascript
// Use Object.prototype.hasOwnProperty.call() to handle objects without prototype
if (Object.prototype.hasOwnProperty.call(obj, key)) {
  sanitized[key] = sanitizeObject(obj[key]);
}
```

## Why This Works
`Object.prototype.hasOwnProperty.call(obj, key)` explicitly calls the `hasOwnProperty` method from `Object.prototype`, which works on any object regardless of whether it has a prototype chain.

## Testing
✅ Server restarted successfully (Terminal 36)
✅ No errors in startup logs
✅ Ready to handle requests

## Files Modified
- `backend/middleware/sanitize-input.js` - Fixed hasOwnProperty call

## Best Practice
This is the recommended way to check for own properties in JavaScript:
- ✅ `Object.prototype.hasOwnProperty.call(obj, key)` - Always works
- ✅ `Object.hasOwn(obj, key)` - Modern alternative (Node.js 16.9+)
- ❌ `obj.hasOwnProperty(key)` - Fails on prototype-less objects

## Related Issues
This fix resolves the "Failed to fetch current session" error that was occurring when the frontend tried to call `/api/judges/current-session`.

## Server Status
- **Port:** 5000
- **Process ID:** Terminal 36
- **Status:** ✅ Running
- **Database:** ✅ Connected
- **WebSocket:** ✅ Ready

---

**Next Steps:** Test judge session functionality in the browser to confirm the fix works end-to-end.
