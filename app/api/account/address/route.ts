// app/api/account/address/route.ts
import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

type AddressPayload = {
  fullName: string;
  phone: string;
  country: string;
  city: string;
  street: string;
  postalCode: string;
  comment?: string;
  isDefault?: boolean;
};

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });
    }

    const body = (await req.json()) as AddressPayload;

    const { fullName, phone, country, city, street, postalCode, comment } =
      body;

    if (!fullName || !phone || !country || !city || !street || !postalCode) {
      return NextResponse.json(
        { error: "Будь ласка, заповніть усі обовʼязкові поля" },
        { status: 400 }
      );
    }

    // 🔴 было так (и ломалось):
    // const existingUser = await clerkClient.users.getUser(userId);

    // ✅ должно быть так:
    const client = await clerkClient();
    const existingUser = await client.users.getUser(userId);
    const existingPublic = existingUser.publicMetadata || {};

    await client.users.updateUser(userId, {
      publicMetadata: {
        ...existingPublic,
        shippingAddress: {
          fullName,
          phone,
          country,
          city,
          street,
          postalCode,
          comment: comment ?? "",
          updatedAt: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("ADDRESS_UPDATE_ERROR", error);
    return NextResponse.json(
      { error: "Помилка при збереженні адреси" },
      { status: 500 }
    );
  }
}
