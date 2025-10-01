# Generate Landing Page Image

This Edge Function generates images for landing page sections using OpenAI's DALL-E 3 and stores them in Supabase Storage.

## Features

- **AI Image Generation**: Uses OpenAI DALL-E 3 to generate high-quality images based on text prompts
- **Supabase Storage Integration**: Uploads generated images to the `public-files` bucket
- **Organized File Structure**: Images are stored using the pattern `USER_ID/LANDING_PAGE_ID/YYYY-MM-DD_UUID.png`
- **Public Access**: Images are publicly accessible for embedding in landing pages
- **Section-Level Images**: Each section in a landing page can have its own unique image

## Storage Structure

Images are stored in the `public-files` bucket with the following structure:

```
public-files/
  └── {USER_ID}/
      └── {LANDING_PAGE_ID}/
          ├── 2025-10-01_abc123.png
          ├── 2025-10-01_def456.png
          └── ...
```

This structure:
- Organizes images by user for easy management
- Groups images by landing page for better organization
- Uses date + UUID for unique filenames and version tracking
- Allows for public read access while maintaining ownership

## API Endpoint

### POST `/functions/v1/generate-landing-page-image`

Generates an image for a specific section of a landing page.

#### Authentication

Requires a valid Supabase authentication token in the `Authorization` header.

#### Request Body

```json
{
  "landing_page_id": "uuid",
  "section_index": 0,
  "image_prompt": "A professional image showing..."
}
```

**Parameters:**
- `landing_page_id` (string, required): The UUID of the landing page
- `section_index` (number, required): The index of the section (0-based)
- `image_prompt` (string, required): The text prompt for image generation

#### Response

**Success (200):**
```json
{
  "message": "Image generated and uploaded successfully",
  "image_url": "https://...supabase.co/storage/v1/object/public/public-files/user-id/page-id/2025-10-01_uuid.png",
  "section_index": 0,
  "landing_page_id": "uuid"
}
```

**Error (4xx/5xx):**
```json
{
  "error": "Error message",
  "details": "Additional details"
}
```

## Setup

### 1. Supabase Storage

Create the `public-files` bucket in your Supabase project:

1. Go to Storage in your Supabase dashboard
2. Create a new bucket named `public-files`
3. Set it as **Public** for read access

### 2. Run Migration

Apply the storage policies migration:

```bash
supabase db push
```

Or run the migration file: `20251001_add_image_urls_to_sections.sql`

### 3. Environment Variables

Ensure `OPENAI_API_KEY` is set in your Supabase Edge Functions secrets:

```bash
supabase secrets set OPENAI_API_KEY=sk-...
```

## Usage in Frontend

### From Landing Pages Management UI

1. Navigate to the Landing Pages page
2. Expand a landing page to view its sections
3. Click the "Generate" button on any section with an image prompt
4. Wait for the image to be generated (typically 10-30 seconds)
5. The image will appear in the section preview and on the public page

### Programmatic Usage

```javascript
const { data: { session } } = await supabase.auth.getSession();

const response = await fetch(
  'https://your-project.supabase.co/functions/v1/generate-landing-page-image',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify({
      landing_page_id: 'page-uuid',
      section_index: 0,
      image_prompt: 'A professional image showing modern technology'
    })
  }
);

const result = await response.json();
console.log('Image URL:', result.image_url);
```

## Image Specifications

- **Model**: DALL-E 3
- **Size**: 1792x1024 (landscape format, optimized for landing pages)
- **Quality**: Standard
- **Format**: PNG
- **Response**: URL (image is temporarily hosted by OpenAI, then uploaded to Supabase)

## Security

### Row Level Security (RLS)

The function enforces proper authorization:
1. User must be authenticated
2. User must own the campaign associated with the landing page
3. Only the image URL pointer is stored in the database (JSONB)

### Storage Policies

- **Upload**: Users can only upload to their own folders (`user_id/*`)
- **Delete**: Users can only delete their own files
- **Read**: Public read access for all files in the bucket

## Data Model

The `sections` field in the `landing_pages` table is a JSONB array where each section can contain:

```typescript
{
  subtitle: string;           // Section heading
  paragraphs: string[];       // Array of paragraph text
  image_prompt: string;       // Prompt for image generation
  image_url?: string;         // URL to generated image (added after generation)
  cta?: string;              // Call-to-action text (optional)
}
```

## Error Handling

The function handles various error scenarios:

- **404**: Landing page not found
- **403**: User doesn't own the landing page
- **400**: Invalid parameters (missing fields, invalid section index)
- **500**: OpenAI API errors, storage errors, database errors

## Cost Considerations

### OpenAI Costs
- DALL-E 3 Standard (1792x1024): ~$0.080 per image
- Each section image generation = 1 API call

### Supabase Storage
- Free tier: 1 GB storage
- Images are typically 1-3 MB each
- Bandwidth costs apply for public access

## Best Practices

1. **Image Prompts**: Write detailed, descriptive prompts for best results
2. **Selective Generation**: Only generate images for key sections
3. **Caching**: Image URLs are stored, regeneration is optional
4. **Error Handling**: Always handle generation failures gracefully
5. **User Feedback**: Show loading states during generation (10-30 seconds)

## Troubleshooting

### Image Not Appearing

1. Check if the image URL is stored in the section
2. Verify the storage bucket is public
3. Check browser console for CORS or loading errors
4. Verify storage policies are applied correctly

### Generation Fails

1. Check OpenAI API key is set correctly
2. Verify user has permission to modify the landing page
3. Check function logs in Supabase dashboard
4. Ensure prompt follows OpenAI content policy

### Storage Upload Fails

1. Verify `public-files` bucket exists
2. Check storage policies are correctly applied
3. Verify user authentication token is valid
4. Check storage quota hasn't been exceeded
