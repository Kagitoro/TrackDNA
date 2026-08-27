const API_INTERNAL_URL = process.env.API_INTERNAL_URL ?? "http://api:8000";

export async function POST(request: Request): Promise<Response> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ detail: "Invalid upload form data." }, { status: 400 });
  }

  let response: Response;
  try {
    response = await fetch(`${API_INTERNAL_URL}/tracks/admin/import`, {
      method: "POST",
      body: form
    });
  } catch {
    return Response.json(
      { detail: `Cannot reach TrackDNA API at ${API_INTERNAL_URL}. Check the api container.` },
      { status: 502 },
    );
  }

  const body = await response.text();
  return new Response(body, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") ?? "application/json"
    }
  });
}
