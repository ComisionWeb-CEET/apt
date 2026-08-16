import { useEffect, useState } from "react";
import { useAuth } from "../config/Auth";
import { socket } from "../config/socket";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { account, setAccount } = useAuth();

  const [usuarioTemp, setUsuarioTemp] = useState("");
  const [password, setPassword] = useState("");

  const [nombre, setNombre] = useState("");
  const [delegacion, setDelegacion] = useState("");

  const navigate = useNavigate();
  const handleGoToPage = () => {
    alert("Esta modalidad no está optimizada para dispositivos móviles :< ¡Próximamente!");
    navigate("/estrado")
  };

  const enviarPublic = (e) => {
    e.preventDefault();
    if (nombre.trim() === "") return;
    if (delegacion.trim() === "") return;

    const payload = {
      nombre: nombre,
      delegacion: delegacion,
      admin: false
    };

    socket.emit("loginPublic", payload);
  };

  const enviarAdmin = (e) => {
    e.preventDefault();
    if (usuarioTemp.trim() === "") return;
    if (password.trim() === "") return;

    const payload = {
      usuario: usuarioTemp,
      password: password,
      admin: false,
    };

    socket.emit("loginAdmin", payload);
  };

  useEffect(() => {
    socket.on("resLogin", (datos) => {
      if (!datos) {
        alert("Usuario o contraseña incorrectos");
        return;
      }

      localStorage.setItem("ceettoken", datos.token);
      setAccount(datos.userData);
    });

    return () => {
      socket.off("resLogin");
    };
  }, [setAccount]);

  const [isHidden, setIsHidden] = useState({
    inicio: true,
    admin: false,
    public: false,
  });

  const toggleHidden = (id) => {
    setIsHidden((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="bg-ceet min-h-screen w-full flex justify-center items-center p-4">
      <div className={isHidden["inicio"] ? 'w-full max-w-md' : 'hidden w-full max-w-md'}>
      <div className="bg-white p-8 rounded-xl shadow-lg flex flex-col gap-6 w-full max-w-md">
        <h2 className="text-2xl text-ceet font-ceet font-bold text-center">
          ¡Bienvenido/a!
        </h2>
          <button
            className="h-9 border border-ceet w-full bg-ceet text-white font-ceet text-center gap-5 rounded-md transform active:scale-95 transition-transform"
            type="button" onClick={() => {toggleHidden("inicio"); toggleHidden("public")}}>
            Entrar como representante
          </button>
          <button
            className="h-9 border border-ceet w-full bg-white text-ceet font-ceet text-center gap-5 rounded-md transform active:scale-95 transition-transform"
            type="button" onClick={() => {toggleHidden("inicio"); toggleHidden("admin")}}>
            Entrar como administrador/a
          </button>
          <button
            className="h-9 w-full bg-white text-ceet font-ceet text-center gap-5 rounded-md transform active:scale-95 transition-transform"
            type="button" onClick={handleGoToPage}>
            Pantalla del estrado
          </button>
      </div>
      </div>

      <div className={isHidden["admin"] ? 'w-full max-w-md' : 'hidden w-full max-w-md'}>
      <div className="bg-white p-8 rounded-xl shadow-lg flex flex-col gap-6 w-full max-w-md">
        <h2 className="text-2xl text-ceet font-ceet font-bold text-center">
          Entrar como administrador/a
        </h2>
        <form className="flex flex-col gap-3" onSubmit={enviarAdmin}>
          <input
            className="h-9 border border-ceet w-full text-ceet font-ceet text-center gap-5 rounded-md"
            type="text"
            placeholder="Usuario"
            value={usuarioTemp}
            onChange={(e) => setUsuarioTemp(e.target.value)}
          />
          <input
            className="h-9 border border-ceet w-full text-ceet font-ceet text-center gap-5 rounded-md"
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            className="h-9 border border-ceet w-full bg-ceet text-white font-ceet text-center gap-5 rounded-md transform active:scale-95 transition-transform"
            type="submit"
          >
            Entrar
          </button>
          <button
            className="h-9 border border-ceet w-full bg-white text-ceet font-ceet text-center gap-5 rounded-md transform active:scale-95 transition-transform"
            type="button" onClick={() => {toggleHidden("inicio"); toggleHidden("admin")}}
          >
            Volver
          </button>
        </form>
      </div>
      </div>

      <div className={isHidden["public"] ? 'w-full max-w-md' : 'hidden w-full max-w-md'}>
      <div className="bg-white p-8 rounded-xl shadow-lg flex flex-col gap-6 w-full max-w-md">
        <h2 className="text-2xl text-ceet font-ceet font-bold text-center">
          Entrar como representante
        </h2>
        <form className="flex flex-col gap-3" onSubmit={enviarPublic}>
          <input
            className="h-9 border border-ceet w-full text-ceet font-ceet text-center gap-5 rounded-md"
            type="text"
            placeholder="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          <input
            className="h-9 border border-ceet w-full text-ceet font-ceet text-center gap-5 rounded-md"
            type="text"
            placeholder="Delegación"
            value={delegacion}
            onChange={(e) => setDelegacion(e.target.value)}
          />
          <button
            className="h-9 border border-ceet w-full bg-ceet text-white font-ceet text-center gap-5 rounded-md transform active:scale-95 transition-transform"
            type="submit"
          >
            Entrar
          </button>
          <button
            className="h-9 border border-ceet w-full bg-white text-ceet font-ceet text-center gap-5 rounded-md transform active:scale-95 transition-transform"
            type="button" onClick={() => {toggleHidden("inicio"); toggleHidden("public")}}
          >
            Volver
          </button>
        </form>
      </div>
      </div>
    </div>
  );
}
