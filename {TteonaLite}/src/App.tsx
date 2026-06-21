import { useState } from "react";
import { LoginPage } from "./pages/LoginPage";
import { HomePage } from "./pages/HomePage";

function App() {
  const [user, setUser] = useState<{ id: string } | null>(() => {
    const stored = localStorage.getItem("tteonalite_user");
    return stored ? JSON.parse(stored) : null;
  });

  if (!user) {
    return (
      <LoginPage
        onLoginSuccess={(loggedInUser) => {
          localStorage.setItem("tteonalite_user", JSON.stringify(loggedInUser));
          setUser(loggedInUser);
        }}
      />
    );
  }

  return <HomePage user={user} />;
}

export default App;
