# 🥸 Perudo App

*A next-gen Perudo app for the people. Now with 20% more deception!*

🎥 **Demo Video**  
- [Loom Demo (1:44)](https://www.loom.com/share/6c7391f41df24d199cc386a52c526981) 

This is a multiplayer web version of the classic bluffing dice game **Perudo**, rebuilt for the modern era using [React](https://reactjs.org/), [Vite](https://vitejs.dev/), [TypeScript](https://www.typescriptlang.org/), and [Firebase](https://firebase.google.com/).

---

## 🚀 Tech Stack

- ⚛️ **React** – Fast, component-driven UI
- ⚡ **Vite** – Ultra-fast build tool
- 🔤 **TypeScript** – Static typing for safer code
- 🔥 **Firebase** – Auth, hosting, and realtime sync (coming soon)
- 🎨 **Tailwind CSS** + [shadcn/ui](https://ui.shadcn.com) – Beautiful, modern styling
- 🤖 **GitHub Actions** – CI/CD for production deploys

---

## 🧑‍💻 Getting Started

1. **Clone the repo:**

    ```bash
    git clone git@github.com:your-username/perudo-app.git
    cd perudo-app
    ```

2. **Install dependencies:**

    ```bash
    npm install
    ```

3. **Set up environment variables:**

    Create a `.env` file in the root of the project with your Firebase credentials and invite code:

    ```env
    VITE_FIREBASE_API_KEY=your-api-key-here
    VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain-here
    VITE_FIREBASE_PROJECT_ID=your-project-id-here
    VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket-here
    VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id-here
    VITE_FIREBASE_APP_ID=your-app-id-here
    VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id-here
    VITE_INVITE_CODE=your-invite-code-here
    ```

    > 🔐 Only users with a valid invite code can sign up.

4. **Start the development server:**

    ```bash
    npm run dev
    ```

    Then visit [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧾 Features

- ✅ Firebase Auth with protected routes
- ✅ Invite-only account creation
- ✅ Styled login/signup with shadcn/ui and Tailwind CSS
- ✅ GitHub Actions deployment to Firebase Hosting
- [ ] Realtime game state sync with Firebase
- [ ] Player lobbies and nickname support
- [ ] Custom house rules (ghosts, zombies, skulls)
- [ ] Dice animations and sound effects
- [ ] Mobile-friendly UI

---

## 📁 Project Structure

```
src/
├── components/        # Reusable UI components (shadcn/ui)
├── context/           # AuthContext and other providers
├── pages/             # Page-level components (Login, Game)
├── routes/            # Route setup with protected guards
├── lib/               # Utility helpers like cn
├── firebase/          # Firebase config/init
├── App.tsx            # Root component
└── main.tsx           # App entry point
```

---

## 🚢 Deployment

Deployments are handled automatically via GitHub Actions when code is pushed to the `main` branch. Secrets are injected at build time using the GitHub Actions workflow and Firebase Hosting.

> Want to trigger a manual deploy? You can now run the workflow directly from GitHub’s UI thanks to `workflow_dispatch`.

---

## 🧠 Contributing

This project is just getting started! Want to help shape it? Open a PR, create an issue, or fork and experiment.

---

## 🛡 License

MIT — do what you want, just don't sue us.

---

## 🤝 Built by

- [@ryan-keiper](https://github.com/ryan-keiper)
- Your awesome co-dev