# 🧪 Local Testing Guide - Make Your App Accessible to Friends

This guide will help you test your app locally and make it accessible to your friend over the internet.

## 📋 Prerequisites

1. **ngrok** - Free tool to expose local server to internet
   - Download from: https://ngrok.com/download
   - Or install via: `npm install -g ngrok`
   - Sign up for free account at https://ngrok.com (free tier is enough)

## 🚀 Step-by-Step Instructions

### Step 1: Build the React App

```bash
cd client
npm install
npm run build
cd ..
```

This creates the production build in `client/build` folder.

### Step 2: Start the Server

```bash
cd server
npm install
npm start
```

You should see: `Server is running on port 5000`

**Keep this terminal window open!**

### Step 3: Start ngrok (in a NEW terminal)

```bash
ngrok http 5000
```

You'll see output like:
```
Forwarding   https://abc123.ngrok-free.app -> http://localhost:5000
```

**Copy the HTTPS URL** (the one starting with `https://`)

### Step 4: Share the URL with Your Friend

Give your friend:
1. **The ngrok URL** (e.g., `https://abc123.ngrok-free.app`)
2. **Instructions to use it:**
   - Open the URL in their browser
   - If they see an ngrok warning page, click "Visit Site"
   - They can now test the connection

### Step 5: Test Connection

1. **You (in Bangalore):**
   - Open: `https://abc123.ngrok-free.app` (or `http://localhost:5000` locally)
   - Login with your credentials

2. **Your Friend (in village):**
   - Open: `https://abc123.ngrok-free.app`
   - Login with their credentials
   - Try the "Test Connection" button in the troubleshooting section

## ⚠️ Important Notes

1. **ngrok URL changes** - Each time you restart ngrok, you get a new URL
   - Free ngrok: URL changes on restart
   - Paid ngrok: Can have fixed URL

2. **Keep both running:**
   - Keep the server running (Step 2)
   - Keep ngrok running (Step 3)
   - If either stops, the connection will break

3. **ngrok session timeout:**
   - Free ngrok sessions may timeout after 2 hours
   - Just restart ngrok if it stops working

4. **Firewall:**
   - Make sure Windows Firewall allows port 5000
   - ngrok handles the external connection, so no router configuration needed

## 🔧 Alternative: Use Your Public IP (Advanced)

If you want a more permanent solution:

1. **Find your public IP:**
   - Visit: https://whatismyipaddress.com
   - Note your public IP address

2. **Port forwarding (requires router access):**
   - Forward port 5000 to your computer's local IP
   - Your friend can access: `http://YOUR_PUBLIC_IP:5000`

3. **Security warning:**
   - This exposes your server directly to the internet
   - Only use for testing, not production

## 🐛 Troubleshooting

### Issue: ngrok shows "Visit Site" page
**Solution:** This is normal for free ngrok. Click "Visit Site" button.

### Issue: Connection timeout
**Solution:**
- Check if server is running (Step 2)
- Check if ngrok is running (Step 3)
- Restart both if needed

### Issue: Friend can't connect
**Solution:**
1. Verify ngrok URL is correct
2. Check server logs for errors
3. Try the "Test Connection" feature in the app
4. Check if friend's network blocks certain domains

### Issue: ngrok command not found
**Solution:**
- Install ngrok: https://ngrok.com/download
- Or use: `npm install -g ngrok` (if you have Node.js)

## ✅ Quick Test Checklist

- [ ] Server is running on port 5000
- [ ] React app is built (`client/build` exists)
- [ ] ngrok is running and showing HTTPS URL
- [ ] You can access the app locally
- [ ] Friend can access the ngrok URL
- [ ] Both can login
- [ ] Messages can be sent and received

## 🎯 Next Steps After Testing

Once you confirm it works:
1. Deploy to Railway (backend) and Cloudflare Pages (frontend)
2. Use the production URLs instead of ngrok
3. This will be more stable and permanent

---

**Good luck with testing! 🚀**

