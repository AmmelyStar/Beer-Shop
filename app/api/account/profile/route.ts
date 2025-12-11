// app/api/account/profile/route.ts
import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    console.log("PROFILE_UPDATE: start");

    const { userId } = await auth();

    if (!userId) {
      console.error("PROFILE_UPDATE_ERROR: no userId");
      return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });
    }

    const body = await req.json();

    const { firstName, lastName, phone, birthday, gender } = body as {
      firstName?: string;
      lastName?: string;
      phone?: string;
      birthday?: string;
      gender?: string;
    };

    // ✅ ВАЖНО: в твоей версии clerkClient — ФУНКЦИЯ
    const client = await clerkClient();
    const existingUser = await client.users.getUser(userId);
    const existingPublic = existingUser.publicMetadata || {};

    await client.users.updateUser(userId, {
      firstName: firstName?.trim() || undefined,
      lastName: lastName?.trim() || undefined,
      publicMetadata: {
        ...existingPublic,
        phone: phone || null,
        birthday: birthday || null,
        gender: gender || null,
      },
    });

    console.log("PROFILE_UPDATE: success");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PROFILE_UPDATE_ERROR", error);
    return NextResponse.json(
      { error: "Помилка при збереженні профілю" },
      { status: 500 }
    );
  }
}
