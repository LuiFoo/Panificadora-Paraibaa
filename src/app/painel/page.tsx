"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useUser } from "@/context/UserContext";

export default function Painel() {
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verificarPermissao = async () => {
      const saved = localStorage.getItem("usuario");
      if (!saved) {
        router.replace("/login");
        return;
      }

      const u = JSON.parse(saved);

      try {
        const res = await fetch("/api/verificar-admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ login: u.login, password: u.password }),
        });

        if (!res.ok) {
          router.replace("/login");
          return;
        }

        setLoading(false);
      } catch (err) {
        console.error(err);
        router.replace("/login");
      }
    };

    verificarPermissao();
  }, [router]);

  if (loading) return <p>Verificando permissão...</p>;

  return (
    <>
      <Header />
      <div className="p-4">
        <h1 className="text-2xl font-bold">Painel Administrativo</h1>
        <p>Bem-vindo, {user?.name}</p>
      </div>
      <Footer showMap={false} />
    </>
  );
}
