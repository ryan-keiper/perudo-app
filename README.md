# 🥸 Perudo App

*A next-gen Perudo app for the people.*

This is a multiplayer web version of the classic bluffing dice game **Perudo**, rebuilt for the modern era using [React](https://reactjs.org/), [Vite](https://vitejs.dev/), [TypeScript](https://www.typescriptlang.org/), and [Firebase](https://firebase.google.com/).

---

## 🚀 Tech Stack

- ⚛️ **React** – Fast, component-driven UI
- ⚡ **Vite** – Ultra-fast build tool
- 🔤 **TypeScript** – Static typing for safer code
- 🔥 **Firebase** – Realtime database, auth, and hosting

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

    Create a `.env` file in the root with your Firebase config:

    ```
    VITE_FIREBASE_API_KEY=your-api-key
    VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
    VITE_FIREBASE_PROJECT_ID=your-project-id
    VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
    VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
    VITE_FIREBASE_APP_ID=your-app-id
    ```

4. **Start the development server:**

    ```bash
    npm run dev
    ```

    Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧾 Features (Planned)

- [ ] Realtime game state sync with Firebase
- [ ] Player lobbies and nickname support
- [ ] Custom house rules (ghosts, zombies, skulls)
- [ ] Dice animations and sound effects
- [ ] Mobile-friendly UI

---

## 📁 Project Structure

```
src/
├── components/    # Reusable UI components
├── pages/         # Page-level views
├── firebase.ts    # Firebase config/init
├── App.tsx        # Root component
└── main.tsx       # Entry point
```

---

## 🧠 Contributing

This project is just getting started! Want to help shape it? Open a PR, create an issue, or just fork and experiment.

---

## 🛡 License

MIT — do what you want, just don't sue us.

---

## 🤝 Built by

- [@ryan-keiper](https://github.com/ryan-keiper)
- Your awesome co-dev