import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
  "application/pdf",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Mo

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "Aucun fichier fourni." },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message: "Format de fichier non supporté. Utilisez JPG, PNG, WEBP ou PDF.",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: "Le fichier dépasse la taille maximale autorisée (10 Mo)." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64Data}`;

    return NextResponse.json({
      success: true,
      url: dataUrl,
      fileName: file.name,
      size: file.size,
      mimeType: file.type,
    });
  } catch (error: unknown) {
    console.error("[UPLOAD_API_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "Une erreur est survenue lors de l'upload." },
      { status: 500 }
    );
  }
}
