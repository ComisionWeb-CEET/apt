import { useState, useEffect } from "react";
import { useAuth } from "../config/Auth";
import { socket } from "../config/socket";

export default function Public() {
  const { account, setAccount } = useAuth();

  const [conectado, setConectado] = useState(false);

  const [asamblea, setAsamblea] = useState({
    turnos: [],
    historial: [],
    tema: "",
    archivo: "",
    hayArchivo: false,
    turnoAbierto: true,
    minutos: 0,
  });

  const [tiempo, setTiempo] = useState(0);

  const turnoHablando = asamblea.turnos.find(
    (turno) => turno.hablando == 1 || turno.hablando === true,
  );

  useEffect(() => {
    socket.on("estadoActualizado", (estado) => {
      setAsamblea(estado);
      setConectado(true);
    });

    socket.on("tiempo", (t) => setTiempo(t));

    socket.emit("pedirUpdate");

    return () => {
      socket.off("estadoActualizado");
      socket.off("tiempo");
    };
  }, []);

  const pedirTurno = (intervencion) => {
    const prioridades = {
      "Apunte técnico": { prioridad: 5, icono: "/fr_apunteTecnico.png" },
      "Punto de información": {
        prioridad: 4,
        icono: "/fr_puntoInformacion.png",
      },
      "Respuesta por alusión directa": {
        prioridad: 3,
        icono: "/fr_respuestaDirecta.png",
      },
      "Respuesta normal": { prioridad: 2, icono: "/fr_respuestaDirecta.png" },
      Intervención: { prioridad: 1, icono: "/fr_intervencionSimple.png" },
    };

    socket.emit("pedirTurno", {
      nombre: account.nombre,
      delegacion: account.delegacion,
      intervencion: intervencion,
      prioridad: prioridades[intervencion].prioridad,
      minutos: asamblea.minutos,
      icono: prioridades[intervencion].icono,
      solicitud: true,
      hablando: false,
      ejecutado: false,
    });

    setNombre("");
    setDelegacion("");
  };

  const cortarTurno = (datos) => {
    socket.emit("cortarTurno", {
      id: datos.id,
      nombre: datos.nombre,
      delegacion: datos.delegacion,
    });

    setNombre("");
    setDelegacion("");
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const cerrarSesion = (e) => {
    e.preventDefault();
    localStorage.removeItem("ceettoken");
    setAccount(null);
  };

  return (
    <div className="min-h-screen flex flex-col justify-top items-center w-fulls py-4 gap-2 bg-white">
      <div className="w-full flex-row justify-between px-4 grid grid-cols-7">
        <span className="text-gray-400 font-bold font-ceet py-2 col-span-6 justify-between items-center">
          {account.rol !== null
            ? `Has iniciado sesión como: ${account.nombre} - ${account.delegacion}`
            : `Has iniciado sesión como: ${account.nombre} - ${account.delegacion} (${account.rol})`}
        </span>
        <button
          className="border font-ceet text-white border-red-700 bg-red-700 rounded-md col-span-1 transform active:scale-95 transition-transform"
          type="button"
          onClick={cerrarSesion}
        >
          Cerrar sesión
        </button>
      </div>

      <div className="w-full py-4 flex flex-col justify-center overflow-hidden px-4 rounded-md">
        <div className="py-4 bg-ceet text-white rounded-md">
          <h2 className="gap-2 text-white font-ceet pl-4">Tema actual</h2>
          <div className="w-full overflow-hidden mt-1 @container gap-2">
            <h3 className="text-4xl font-bold text-white font-ceet whitespace-nowrap inline-block animate-reveal w-max pl-4 pr-4">
              {asamblea.tema || "Sin tema seleccionado"}
            </h3>
          </div>
        </div>
        {asamblea.hayArchivo ? (
          <a className="py-2 text-ceet font-ceet pl-4 hover:underline" href={asamblea.archivo} download>
            Descargar la documentación de este punto
          </a>
        ) : (
          <h2 className="py-2 text-ceet font-ceet pl-4">No hay un archivo disponible.</h2>
        )}
        
      </div>

      <br />

      <div className="w-full py-2 flex flex-col justify-center overflow-hidden px-4 rounded-md">
        <div className="py-4 border border-ceet rounded-md">
          <h2 className="gap-2 text-ceet font-ceet pl-4 animate-pulse">
            Ahora hablando...
          </h2>
          <div className="flex-row justify-center items-center grid grid-cols-12">
            <div className="w-full overflow-hidden mt-1 @container gap-2 col-span-10">
              <h3 className="text-4xl font-bold text-ceet font-ceet whitespace-nowrap inline-block w-max pl-4 pr-4">
                {turnoHablando ? (
                  <>
                    {turnoHablando.nombre} - {turnoHablando.delegacion}
                  </>
                ) : (
                  <span className="font-ceet text-ceet">
                    No hay nadie hablando
                  </span>
                )}
              </h3>
            </div>

            {turnoHablando ? (
              <>
                <div className="w-full overflow-hidden mt-1 @container gap-2 col-span-2">
                  <h3 className="text-4xl font-bold text-ceet font-ceet whitespace-nowrap inline-block w-max pl-4 pr-4">
                    {formatTime(tiempo)}
                  </h3>
                </div>
              </>
            ) : (
              <> </>
            )}
          </div>
        </div>
      </div>

      <br />

      <div className="w-screen">
        <div className="flex flex-row justify-center items-center w-full gap-1">
          
            {asamblea.turnoAbierto ? (
              <>
              <div className="grid grid-cols-6 gap-3 w-full h-10 justify-between items-center px-4">
                <button
                  type="button"
                  className="bg-ceet rounded-md font-ceet text-white h-full col-span-1"
                  onClick={() => pedirTurno("Punto de orden")}
                >
                  Punto de orden
                </button>
                <button
                  type="button"
                  className="bg-ceet rounded-md font-ceet text-white h-full col-span-1"
                  onClick={() => pedirTurno("Apunte técnico")}
                >
                  Apunte técnico
                </button>
                <button
                  type="button"
                  className="bg-ceet rounded-md font-ceet text-white h-full col-span-1"
                  onClick={() => pedirTurno("Punto de información")}
                >
                  Punto de información
                </button>
                <button
                  type="button"
                  className="bg-ceet rounded-md font-ceet text-white h-full col-span-1"
                  onClick={() => pedirTurno("Respuesta por alusión directa")}
                >
                  Respuesta por alusión directa
                </button>
                <button
                  type="button"
                  className="bg-ceet rounded-md font-ceet text-white h-full col-span-1"
                  onClick={() => pedirTurno("Respuesta normal")}
                >
                  Respuesta normal
                </button>
                <button
                  type="button"
                  className="bg-ceet rounded-md font-ceet text-white h-full col-span-1"
                  onClick={() => pedirTurno("Intervención")}
                >
                  Intervención
                </button>
                </div>
              </>
            ) : (
              <span className="font-ceet text-ceet">
                Turno cerrado (womp womp)
              </span>
            )}
          
        </div>

        <br />

        <div className="flex flex-col gap-5 p-4">
          {asamblea.turnos
            .filter((turno) => !turno.hablando)
            .map((turno, index) => (
              <div className="flex flex-row w-full gap-1" key={turno.id}>
                {!turno.ejecutado ? (
                  <div className="grid grid-cols-7 gap-3 w-full h-10 justify-between items-center">
                    <div className="h-full flex flex-col justify-center items-center font-semibold bg-ceet text-white border border-ceet col-span-1">
                      {index + 1}.
                    </div>
                    <div className="h-full flex flex-col justify-center items-center font-ceet text-ceet font-bold border border-ceet col-span-2">
                      {turno.nombre} - {turno.delegacion}
                    </div>
                    <img
                      src={turno.icono}
                      alt={turno.intervencion}
                      className="w-6 h-6 object-contain"
                    />

                    {turno.nombre === account.nombre &&
                    turno.delegacion === account.delegacion ? (
                      <>
                        <div className="h-full flex flex-col justify-center items-center font-ceet text-ceet border border-ceet col-span-2">
                          {turno.intervencion}
                        </div>
                        <button
                          className="border border-red-800 font-ceet text-red-800 h-full col-span-1"
                          type="button"
                          onClick={() => cortarTurno(turno)}
                        >
                          Cortar turno
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="h-full flex flex-col justify-center items-center font-ceet text-ceet border border-ceet col-span-3">
                          {turno.intervencion}
                        </div>{" "}
                      </>
                    )}
                  </div>
                ) : (
                  <></>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
