// app/api/shopify/sync-customer/route.ts

import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { syncClerkUserToShopify } from "@/app/lib/shopify/customers";

export async function POST() {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // берём primary email, если есть, иначе первый
    const primaryEmail =
      user.emailAddresses.find(
        (e) => e.id === user.primaryEmailAddressId
      ) ?? user.emailAddresses[0];

    if (!primaryEmail?.emailAddress) {
      return NextResponse.json(
        { error: "No email on Clerk user" },
        { status: 400 }
      );
    }

    const customer = await syncClerkUserToShopify({
      email: primaryEmail.emailAddress,
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
      phone: user.primaryPhoneNumber?.phoneNumber ?? null,
    });

    return NextResponse.json(
      { ok: true, customer },
      { status: 200 }
    );
  } catch (err) {
    // тут мы логируем полную ошибку в консоль сервера
    console.error("Sync Shopify customer error:", err);

    const message =
      err instanceof Error ? err.message : JSON.stringify(err);

    // а тут отправляем реальный текст ошибки в JSON,
    // чтобы в dev ты его увидела в Network → Response
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
