import DB from '@app/_Database/db';
import HandleResponse from '@app/_utils/response';
import User from '@app/_model/user/user.model';
import Company from '@app/_model/Companay/company.model';
import { SignJWT } from 'jose';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'property360noida@gmail.com',
    pass: 'panm kqtg ugan mcza',
  },

});

/**
 * @swagger
 * tags:
 *   - name: User Management
 *     description: Operations related to user management
 *
 * /api/v1/login:
 *   post:
 *     tags:
 *       - User Management
 *     description: Login for Admin and Staff
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user:
 *                 type: string
 *                 description: You can enter mail, phone or username
 *                 example: You can enter mail, phone or username
 *               password:
 *                 type: string
 *                 description: The password for the user
 *                 example: securepassword123
 *     responses:
 *       200:
 *         description: Login successfully!
 *       400:
 *         description: Bad request
 */
export async function POST(req: Request) {
  try {
    await DB();
    // DEBUG: Check which database you're actually connected to
    console.log('Connected to database:', User.db.name);
    console.log('User collection:', User.collection.name);
    
    // Count total users in this database
    const userCount = await User.countDocuments();
    console.log('Total users in database:', userCount);
    const { user, password } = await req.json();
    if (!user || !password) {
      return HandleResponse({ type: "BAD_REQUEST", message: "'email' and 'password' fields are required." })
    }
    // const user_: any = await User.findOne({ $or: [{ userName: String(user).trim().toLocaleLowerCase() }, { email: String(user).trim().toLocaleLowerCase() }, { phone: String(user).trim().toLocaleLowerCase() }] }).populate([{ path: 'company', model: Company }]).select('userName company role password isActive email');
    const user_: any = await User.findOne({
      $or: [
        { userName: String(user).trim().toLowerCase() },
        { email: String(user).trim().toLowerCase() },
        { phone: String(user).trim().toLowerCase() }
      ]
    })
      .populate([{ path: 'company', model: Company }])
      .select('userName company role password isActive email designation subordinate createdBy')
      .lean(); 


    if (!user_) {
      return HandleResponse({ type: "BAD_REQUEST", message: "'User' or 'Password' fields are Wrong." })
    }
    if (!user_.isActive) {
      return HandleResponse({ type: "BAD_REQUEST", message: "Your account has been disabled. Please contact admin." })
    }
    const comparepassword = await bcrypt.compare(password, user_.password)
    if (!comparepassword) {
      return HandleResponse({ type: "BAD_REQUEST", message: "Password fields are Wrong." })
    };

    const comUserId = { compId: user_?.company?._id, userId: user_?._id };

    const iat = Math.floor(Date.now() / 1000);
    const exp = user_.role === 4 ? iat + 60 * 60 * 24 : iat + 60;
    const refreshExp = iat + 60 * 60 * 24;
    const accessToken = await new SignJWT({ access: JSON.stringify(user_) })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(exp)
      .setIssuedAt(iat)
      .setNotBefore(iat)
      .sign(new TextEncoder().encode(process.env.NEXTAUTH_SECRET!))
    const refreshToken = await new SignJWT({ refresh: JSON.stringify(user_) })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(refreshExp)
      .setIssuedAt(iat)
      .setNotBefore(iat)
      .sign(new TextEncoder().encode(process.env.NEXTAUTH_SECRET!))


    // console.log("user_user_user_", JSON.stringify(user_, null, 2));
    // console.log("subordinatesubordinatesubordinate", user_?.subordinate);


    return HandleResponse({
      type: "SUCCESS",
      message: "LogIn successfully",
      data: {
        accessToken,
        refreshToken,
        comUserId,
        role: user_?.role,
        user: {
          userName: user_?.userName,
          designation: user_?.designation,
          createdBy: user_?.createdBy,
          subordinate: user_?.subordinate
        }
      }
    })
  } catch (error: any) {
    return HandleResponse({
      type: "BAD_REQUEST",
      message: error?.message
    })
  }
}

export async function PUT(req: Request) {
  try {
    await DB();

    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return HandleResponse({
        type: "BAD_REQUEST",
        message: "Email is required.",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return HandleResponse({
        type: "BAD_REQUEST",
        message: "Invalid email format.",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return HandleResponse({
        type: "BAD_REQUEST",
        message: "User not found with this email.",
      });
    }

    const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.password = randomCode;
    await user.save();
    const mailOptions = {
      to: email,
      from: "property360noida@gmail.com",
      subject: 'Your Password Reset Code',
      text: `Hello ${user.userName.toUpperCase()},\n\nWe have successfully processed your password change request. Your new temporary password is: ${randomCode}.\n\nPlease use this password to log in. If you need any assistance or have any questions, feel free to reach out.\n\nThank you for choosing Property 360.\n\nBest regards,\n\nProperty 360.`
    };

    await new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          reject(error);
        } else {
          resolve(info);
        }
      });
    });
    return HandleResponse({
      type: "SUCCESS",
      message: "Password sent to your email ID successfully.",
    });
  } catch (error) {
    console.error(error);
    return HandleResponse({
      type: "BAD_REQUEST",
      message: "An error occurred. Please try again later.",
    });
  }
}