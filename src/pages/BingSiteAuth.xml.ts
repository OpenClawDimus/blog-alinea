export function GET() {
  return new Response(
    '<?xml version="1.0"?>\n<users>\n\t<user>035676F7244999C7E5409CBAB3B289AC</user>\n</users>',
    {
      headers: { "Content-Type": "application/xml" },
    }
  );
}
