# File Upload & Page Count Extraction (Fastify)

This document explains how to upload files using **Fastify** and extract the number of pages from supported file types.

## Supported File Types

| Type       | MIME Type         | Pages             |
| ---------- | ----------------- | ----------------- |
| PDF        | `application/pdf` | Actual page count |
| PNG        | `image/png`       | 1                 |
| JPG / JPEG | `image/jpeg`      | 1                 |

Images are always treated as a single page.

---

## Dependencies

Install the required packages:

```bash
npm install @fastify/multipart pdf-parse
```

---

## Register Multipart Support

Fastify needs multipart support to handle file uploads.

```js
import Fastify from 'fastify'
import multipart from '@fastify/multipart'

const fastify = Fastify()

fastify.register(multipart)
```

---

## Upload Endpoint

The endpoint:

* Accepts a single uploaded file
* Detects the file type using MIME type
* Extracts page count for PDFs
* Returns `1` for image files

```js
import pdf from 'pdf-parse'

fastify.post('/upload', async (request, reply) => {
  const file = await request.file()

  if (!file) {
    return reply.code(400).send({ error: 'No file uploaded' })
  }

  const buffer = await file.toBuffer()
  const { mimetype } = file

  let pages = 1

  if (mimetype === 'application/pdf') {
    const data = await pdf(buffer)
    pages = data.numpages
  } else if (
    mimetype === 'image/png' ||
    mimetype === 'image/jpeg'
  ) {
    pages = 1
  } else {
    return reply.code(400).send({ error: 'Unsupported file type' })
  }

  return {
    filename: file.filename,
    type: mimetype,
    pages
  }
})
```

---

## Example Responses

### PDF Upload

```json
{
  "filename": "document.pdf",
  "type": "application/pdf",
  "pages": 8
}
```

### Image Upload

```json
{
  "filename": "image.png",
  "type": "image/png",
  "pages": 1
}
```

---

## Notes & Best Practices

* Always rely on **MIME type**, not file extensions
* For large files, consider streaming to disk instead of loading into memory
* Add file size limits to prevent abuse
* Use HTTPS when handling file uploads in production

---

## Possible Extensions

* Multiple file uploads
* Disk-based storage
* TypeScript implementation
* PDF manipulation (merge, split, rotate)

---

## Summary

This setup provides a simple and reliable way to:

* Upload files using Fastify
* Extract page count from PDFs
* Normalize images as single-page documents
