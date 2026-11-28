# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

# logistics-app

## Open work (customer app)

Moved here from the old root `FRONTEND_TODO.md` on 28 November 2026 (last updated there on 17
November). Backend needs are in [../BACKEND_TODO.md](../BACKEND_TODO.md).

- **Run:** launch iOS against Metro on port 8081. An old dev-client bundler on 8083 once served a
  stale localhost build ("No internet connection").
- **Booking redesign (11–12 November):** checked on the Android emulator only. Still to do: place
  one test order with a goods type and check it on AWS and in the CMS; fix the first quote failing
  right after an app restart; check iOS and dark mode; check the live trip screen and cancel flow
  with a live order. Removed until the API backs them: booking rules, restricted items, payment
  picker, GSTIN, help answers, Terms/Privacy/Invite links, banner images, the customer's rating
  star. Unused artwork remains in `assets/images/banners/`. The pickup "X mins" comes from
  `GET /vehicles/nearby`; not seen yet with drivers online.
- **Push notifications (17 November):** done in code, not run on a device. Needs a native rebuild;
  Firebase `google-services.json` is in the app root. Waiting on backend item 17. Not started: the
  lock-screen trip card (Android ongoing notification, then an iOS Live Activity).
- **Business enquiries (17 November):** opens the website's business page in a web view (rebuild
  first). Set `EXPO_PUBLIC_BUSINESS_URL` to the production page before release; only the `www.`
  host serves it.
- **Tracking:** the marker glides along the road, the passed route greys out, the ETA counts down
  steadily, stillness badges ("Loading at pickup · 6 min"), a weak-signal note instead of a frozen
  map, titles from "Finding driver" to "Delivered".
- **From product (MOM):** a "Turn on location" button when location is off; pickup and drop
  floating over the map; a "Read before ordering" sheet per vehicle type; UPI options next to cash;
  a prohibited-goods notice; Order history easy to reach in Account; a business account enquiry.
- **To verify on AWS:** every order status including `AWAITING_PAYMENT` and failures; delivery-code
  resend; multi-stop sharing (own link and code per receiver, expiry); invoice total; stale
  positions hidden and recovery after reconnect; order history refresh and paging.
- **Design:** finish the Figma comparison; check light and dark mode, accessibility and error
  states.
- **Added 28 November (checked on the Android emulator with real reads; nothing sent):**
  - Log out also ends the session on the server (`POST /auth/logout`, 5 s limit).
  - Chat with the driver: a chat button next to Call on the live trip, from driver assigned until
    payment. Text only; checks for new messages every 5 s. Not yet tried on a live order.
  - Help & support lists "Your requests" with status. Each opens the replies and a reply box;
    closed requests can't be answered.
  - Trip details on a delivered or failed trip: "Goods damaged or lost?" files a claim and then
    shows its status and agreed amount. Photos are not sent yet: the app has no photo picker, and
    adding `expo-image-picker` needs a native rebuild. Refund status shows when the order has one.
  - Offer banners count views (once per banner per app run) and taps for the CMS.
  - Fares show one total only (booking review and trip details), never the fare lines. The
    invoice PDF still has the full breakdown.
