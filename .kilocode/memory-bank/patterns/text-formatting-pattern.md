# Text Formatting Pattern

**Effective Date**: 2025-10-17
**Author**: Kilo Code System
**Review Cycle**: Quarterly

## Pattern Overview

This pattern defines the standard approach for rendering formatted text content in the frontend, particularly for patient responses and evaluation reports that contain markdown-style formatting.

## Pattern Structure

```typescript
// Text Formatting Utility Pattern
const formatMessageContent = (content: string): string => {
  return content
    // Convert markdown-style formatting to HTML
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')           // Italics: *text* → <em>text</em>
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') // Bold: **text** → <strong>text</strong>
    .replace(/\n/g, '<br>');                          // Line breaks: \n → <br>
};

// React Component Implementation
const FormattedText: React.FC<{ content: string }> = ({ content }) => {
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: formatMessageContent(content)
      }}
    />
  );
};
```

## Implementation Example

### Message Display Component
```typescript
// Example: Chat message display with formatting
const ChatMessage: React.FC<{ message: Message }> = ({ message }) => {
  return (
    <div className="chat-message">
      <div className="message-content">
        <div
          dangerouslySetInnerHTML={{
            __html: formatMessageContent(message.content)
          }}
        />
      </div>
      <div className="message-timestamp">
        {message.timestamp.toLocaleTimeString()}
      </div>
    </div>
  );
};
```

## Formatting Rules

### Supported Markdown Elements

| Markdown | HTML | Description | Example |
|----------|------|-------------|---------|
| `*text*` | `<em>text</em>` | Italics for emphasis | `*whispers nervously*` |
| `**text**` | `<strong>text</strong>` | Bold for strong emphasis | `**Important:**` |
| `\n` | `<br>` | Line breaks | `Line 1\nLine 2` |

### Security Considerations
- **XSS Prevention**: Only allow safe HTML tags (`<em>`, `<strong>`, `<br>`)
- **Content Sanitization**: Validate and sanitize all formatted content
- **Input Validation**: Ensure markdown parsing doesn't break with malicious input

## Key Benefits

### 1. Enhanced User Experience
- Visual emphasis for important text
- Better readability of patient responses
- Improved emotional expression in simulations

### 2. Consistency
- Uniform formatting across all text displays
- Standardized approach to text rendering
- Consistent visual language

### 3. Maintainability
- Centralized formatting logic
- Easy to extend with new formatting options
- Simple to modify formatting rules

## Usage Guidelines

### 1. When to Use
- Patient responses containing emotional expressions
- Evaluation reports with emphasized sections
- System messages requiring formatting
- Any user-generated content with markdown-style formatting

### 2. When NOT to Use
- Plain data display without formatting needs
- Administrative content without emphasis requirements
- Simple text that doesn't benefit from visual enhancement

### 3. Best Practices
- Always validate input before formatting
- Test formatting with various content types
- Consider accessibility implications of HTML rendering
- Provide fallbacks for environments that don't support HTML

## Related Files
- [Simulation Chat Page](../../../simulatorfrontend/src/pages/SimulationChatPage.tsx)
- [Message Display Components](../../../simulatorfrontend/src/components/)
- [Text Formatting Implementation](../../../simulatorfrontend/src/utils/textFormatting.ts)

## Future Enhancements

### Potential Additions
1. **Link Support**: Convert `[text](url)` to clickable links
2. **List Support**: Convert `- item` to bullet points
3. **Code Blocks**: Support for monospace formatting
4. **Advanced Markdown**: Consider full markdown parser integration

### Accessibility Considerations
1. **Screen Reader Support**: Ensure formatted text is accessible
2. **Keyboard Navigation**: Maintain focus management
3. **Color Contrast**: Verify readability of emphasized text
4. **Alternative Text**: Provide plain text fallbacks

---
**Next Review**: 2025-01-17
**Pattern Owner**: Frontend Development Team