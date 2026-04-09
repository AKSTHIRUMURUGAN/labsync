# API Response Structure

All API endpoints in LabSync follow a consistent response structure using the `successResponse` helper from `lib/api-response.ts`.

## Standard Response Format

```typescript
{
  success: boolean;
  data?: any;           // The actual response data
  error?: {             // Only present when success is false
    code: string;
    message: string;
    fields?: { [field: string]: string };
    details?: any;
    timestamp: string;
  };
  meta?: {              // Optional pagination metadata
    page?: number;
    limit?: number;
    total?: number;
  };
}
```

## Important: Data Access Pattern

When accessing API responses in the frontend, use `data.data` directly, NOT nested properties like `data.data.user` or `data.data.submissions`.

### ✅ Correct Usage

```typescript
// Auth API
const response = await fetch('/api/auth/me');
const data = await response.json();
if (data.success) {
  setUser(data.data);  // ✅ Correct
}

// Submissions API
const response = await fetch('/api/submissions');
const data = await response.json();
if (data.success) {
  setSubmissions(data.data || []);  // ✅ Correct with fallback
}

// Templates API
const response = await fetch('/api/templates');
const data = await response.json();
if (data.success) {
  setTemplates(data.data || []);  // ✅ Correct with fallback
}
```

### ❌ Incorrect Usage

```typescript
// ❌ Wrong - will cause "Cannot read properties of undefined"
setUser(data.data.user);
setSubmissions(data.data.submissions);
setTemplates(data.data.templates);
```

## API Endpoints and Their Response Data

| Endpoint | Response Data Type | Access Pattern |
|----------|-------------------|----------------|
| `/api/auth/me` | User object | `data.data` |
| `/api/auth/login` | `{ user, token }` | `data.data` |
| `/api/auth/register` | `{ user, token }` | `data.data` |
| `/api/submissions` | Array of submissions | `data.data` |
| `/api/submissions/[id]` | Single submission | `data.data` |
| `/api/templates` | Array of templates | `data.data` |
| `/api/templates/[id]` | Single template | `data.data` |
| `/api/sessions` | Array of sessions | `data.data` |
| `/api/lab-groups` | Array of lab groups | `data.data` |
| `/api/notifications` | Array of notifications | `data.data` |

## Best Practices

1. **Always check for success**: 
   ```typescript
   if (data.success) {
     // Handle success
   }
   ```

2. **Provide fallbacks for arrays**:
   ```typescript
   setItems(data.data || []);
   ```

3. **Validate array types**:
   ```typescript
   const items = Array.isArray(data.data) ? data.data : [];
   setItems(items);
   ```

4. **Handle errors gracefully**:
   ```typescript
   try {
     const response = await fetch('/api/endpoint');
     const data = await response.json();
     if (data.success) {
       setData(data.data);
     }
   } catch (error) {
     console.error('Failed to fetch', error);
     setData([]); // Fallback for arrays
   }
   ```

5. **Use error logging**:
   ```typescript
   } catch (error) {
     console.error('Failed to fetch data', error);
   }
   ```

## Common Errors and Solutions

### Error: "Cannot read properties of undefined (reading 'length')"

**Cause**: Trying to access `.length` on undefined data.

**Solution**: 
```typescript
// Before
setSubmissions(data.data.submissions);  // ❌

// After
setSubmissions(data.data || []);  // ✅
```

### Error: "Cannot read properties of undefined (reading 'user')"

**Cause**: Trying to access nested property that doesn't exist.

**Solution**:
```typescript
// Before
setUser(data.data.user);  // ❌

// After
setUser(data.data);  // ✅
```

## Migration Checklist

When updating existing code:

- [ ] Replace `data.data.user` with `data.data`
- [ ] Replace `data.data.submissions` with `data.data`
- [ ] Replace `data.data.templates` with `data.data`
- [ ] Replace `data.data.sessions` with `data.data`
- [ ] Replace `data.data.labGroups` with `data.data`
- [ ] Add fallback values for arrays: `data.data || []`
- [ ] Add array validation: `Array.isArray(data.data) ? data.data : []`
- [ ] Add error logging with the error object
