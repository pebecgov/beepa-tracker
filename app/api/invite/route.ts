import { NextRequest, NextResponse } from "next/server";
import { clerkClient, auth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  try {
    // Verify the request is from an authenticated admin
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, redirectUrl } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const client = await clerkClient();

    // Create a Clerk invitation
    const invitation = await client.invitations.createInvitation({
      emailAddress: email,
      redirectUrl: redirectUrl || `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/`,
      publicMetadata: {
        invitedVia: "admin",
      },
    });

    return NextResponse.json({ 
      success: true, 
      invitationId: invitation.id,
      message: `Invitation sent to ${email}` 
    });
  } catch (error: any) {
    console.error("Error sending invitation:", error);
    
    // Handle specific Clerk errors
    if (error.errors) {
      const clerkError = error.errors[0];
      if (clerkError.code === "form_identifier_exists") {
        return NextResponse.json({ 
          error: "This email is already registered with Clerk. The user can sign in directly." 
        }, { status: 400 });
      }
      if (clerkError.code === "invitation_already_pending") {
        return NextResponse.json({ 
          error: "An invitation is already pending for this email." 
        }, { status: 400 });
      }
      return NextResponse.json({ error: clerkError.message }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: error.message || "Failed to send invitation" 
    }, { status: 500 });
  }
}
