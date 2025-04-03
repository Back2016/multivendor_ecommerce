import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent, clerkClient } from "@clerk/nextjs/server";
import { User } from "@prisma/client";
import { db } from "@/lib/db";
export async function POST(req: Request) {
    // You can find this in the Clerk Dashboard -> Webhooks -> choose the endpoint
    const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
        throw new Error(
            "Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local"
        );
    }

    // Get the headers
    const headerPayload = await headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
        return new Response("Error occured -- no svix headers", {
            status: 400,
        });
    }

    // Get the body
    const payload = await req.json();
    const body = JSON.stringify(payload);

    // Create a new Svix instance with your secret.
    const wh = new Webhook(WEBHOOK_SECRET);

    let evt: WebhookEvent;

    // Verify the payload with the headers
    try {
        evt = wh.verify(body, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        }) as WebhookEvent;
    } catch (err) {
        console.error("Error verifying webhook:", err);
        return new Response("Error occured", {
            status: 400,
        });
    }

    //   // When user is created or updated
    //   if (evt.type === "user.created" || evt.type === "user.updated") {
    //     // Parse the incoming event data
    //     const data = JSON.parse(body).data;
    //     // console.log(data);

    //     // Create a user object with relevant properties
    //     const user: Partial<User> = {
    //       id: data.id,
    //       name: `${data.first_name} ${data.last_name}`,
    //       email: data.email_addresses[0].email_address,
    //       picture: data.image_url,
    //     };
    //     // If user data is invalid, exit the function
    //     if (!user) return;

    //     // Upsert user in the database (update if exists, create if not)
    //     const dbUser = await db.user.upsert({
    //       where: {
    //         email: user.email,
    //       },
    //       update: user,
    //       create: {
    //         id: user.id!,
    //         name: user.name!,
    //         email: user.email!,
    //         picture: user.picture!,
    //         role: user.role || "USER", // Default role to "USER" if not provided
    //       },
    //     });

    //     // Update user's metadata in Clerk with the role information
    //     const client = await clerkClient();
    //     await client.users.updateUserMetadata(data.id, {
    //       privateMetadata: {
    //         role: dbUser.role || "USER", // Default role to "USER" if not present in dbUser
    //       },
    //     });
    //   }

    // Depend on the event trigger approriate action
    // Handle the sync between clerk and DB when creating new user
    if (evt.type === "user.created") {
        console.log("created");
        // Create user's payload
        const data = JSON.parse(body).data;
        const user: Partial<User> = {
            id: data.id,
            name: `${data.first_name} ${data.last_name}`,
            email: data.email_addresses[0].email_address,
            picture: data.image_url,
        };

        if (!user) {
            return;
        }

        // Create new user record in the DB and give it
        // a default USER role
        const dbUser = await db.user.create({
            data: {
                id: user.id!,
                email: user.email!,
                name: user.name!,
                picture: user.picture!,
                role: user.role || "USER",
            },
        });

        const client = await clerkClient();
        // Get the newly created user from clerk
        const existingMetadata = await client.users.getUser(data.id);

        // Make sure only update the user's metadata when the role did change
        // In the case of new user, the role didn't exist, so we proceed with the update
        if (existingMetadata.privateMetadata?.role !== dbUser.role) {
            await client.users.updateUserMetadata(data.id, {
                privateMetadata: { role: dbUser.role },
            });
        }

        return new Response("Webhook received", { status: 200 });
    }

    if (evt.type === "user.updated") {
        console.log("updated");

        const data = JSON.parse(body).data;
        const client = await clerkClient();
        // Get previous user data from Clerk
        const existingUser = await client.users.getUser(data.id);
        if (!existingUser) {
            return new Response("Error: User not found in DB", { status: 404 });
        }

        // Set the updated fields for the user record
        const user: Partial<User> = {
            id: data.id,
            name: `${data.first_name} ${data.last_name}`,
            email: data.email_addresses[0].email_address,
            picture: data.image_url,
            role: data.private_metadata?.role,
        };

        console.log("user payload", user);

        const existingDbUser = await db.user.findUnique({
            where: { id: user.id },
        });

        if (!existingDbUser) {
            return new Response("Error: User not found in DB", { status: 404 });
        }

        const onlyMetadataChanged =
            JSON.stringify(existingUser.firstName) ===
            JSON.stringify(data.first_name) &&
            JSON.stringify(existingUser.lastName) ===
            JSON.stringify(data.last_name) &&
            JSON.stringify(existingUser.emailAddresses) ===
            JSON.stringify(data.email_addresses) &&
            JSON.stringify(existingUser.imageUrl) ===
            JSON.stringify(data.image_url) &&
            existingUser.privateMetadata?.role === existingDbUser.role; // NEW CHECK

        if (onlyMetadataChanged) {
            return new Response("Ignoring metadata-only update with no role change", {
                status: 200,
            });
        }

        // Update the latest data to DB
        const dbUser = await db.user.update({
            where: {
                email: user.email,
            },
            data: {
                ...user,
            },
        });

        // Make sure only update the user's metadata when the role did change
        // in the case of a newly created user, this won't be trigger
        // since we already added the USER role above
        if (existingUser.privateMetadata?.role !== dbUser.role) {
            await client.users.updateUserMetadata(data.id, {
                privateMetadata: { role: dbUser.role },
            });
        }

        return new Response("Webhook received", { status: 200 });
    }

    // When user is deleted
    if (evt.type === "user.deleted") {
        // Parse the incoming event data to get the user ID
        const userId = JSON.parse(body).data.id;

        // Delete the user from the database based on the user ID
        await db.user.delete({
            where: {
                id: userId,
            },
        });
    }

    return new Response("", { status: 200 });
}
