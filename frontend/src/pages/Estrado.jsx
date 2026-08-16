import { useState, useEffect } from "react";
import { useAuth } from "../config/Auth";
import { socket } from "../config/socket";

export default function Estrado() {
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

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const radio = 90;
  const circunferencia = 2 * Math.PI * radio;
  const tiempoTotalSegundos = asamblea.minutos > 0 ? asamblea.minutos * 60 : 300; 
  const progreso = Math.min(tiempo / tiempoTotalSegundos, 1);
  const offset = circunferencia - progreso * circunferencia;

  return (
    <div className="h-screen flex flex-col justify-top items-center w-full py-4 gap-2 bg-white">
      <div className="w-full py-4 flex flex-col justify-center overflow-hidden px-4 rounded-md shrink-0">
        <div className="py-4 bg-ceet text-white rounded-md">
          <h2 className="gap-2 text-white font-ceet pl-4">Tema actual</h2>
          <div className="w-full overflow-hidden mt-1 @container gap-2">
            <h3 className="text-4xl font-bold text-white font-ceet whitespace-nowrap inline-block animate-reveal w-max pl-4 pr-4">
              {asamblea.tema || "Sin tema seleccionado"}
            </h3>
          </div>
        </div>
      </div>

      <div className="w-full flex-1 grid grid-cols-3 gap-4 px-4 overflow-hidden pb-4">
                <div className="col-span-1 w-full h-full p-6 border border-ceet rounded-md overflow-hidden flex flex-col justify-center items-center text-center gap-6">
          
          <div className="w-full">
            <h2 className="text-ceet font-ceet animate-pulse mb-2 text-xl">
              Ahora hablando...
            </h2>
            <h3 className="text-4xl font-bold text-ceet font-ceet wrap-break-words">
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

          {turnoHablando && (
            <div className="relative w-full max-w-62.5 aspect-square mt-4 flex justify-center items-center">
              <svg viewBox="0 0 200 200" className="w-full h-auto transform -rotate-90">
                <circle
                  cx="100"
                  cy="100"
                  r={radio}
                  fill="none"
                  className="stroke-gray-200"
                  strokeWidth="12"
                />
                <circle
                  cx="100"
                  cy="100"
                  r={radio}
                  fill="none"
                  className="stroke-ceet transition-all duration-500 ease-linear"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={circunferencia}
                  strokeDashoffset={offset}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-6xl font-bold text-ceet font-ceet">
                  {formatTime(tiempo)}
                </span>
              </div>
            </div>
          )}

        </div>

        <div className="col-span-2 w-full h-full overflow-y-auto pr-2 custom-scrollbar">
          <div className="flex flex-col gap-5 p-4">
            {asamblea.turnos
              .filter((turno) => !turno.hablando)
              .map((turno, index) => (
                <div className="flex flex-row w-full gap-1" key={turno.id}>
                  {!turno.ejecutado ? (
                    <div className="grid grid-cols-4 gap-3 w-full h-10 justify-between items-center">
                      <div className="h-full flex flex-col justify-center items-center font-semibold bg-ceet text-white border border-ceet col-span-1 rounded-sm">
                        {index + 1}.
                      </div>
                      <div className="h-full flex flex-col justify-center items-center font-ceet text-ceet font-bold border border-ceet col-span-2 bg-white rounded-sm">
                        {turno.nombre} - {turno.delegacion}
                      </div>
                      <div className="h-full flex items-center justify-center col-span-1">
                        <img
                          src={turno.icono}
                          alt={turno.intervencion}
                          className="w-6 h-6 object-contain"
                        />
                      </div>
                    </div>
                  ) : (
                    <></>
                  )}
                </div>
              ))}
          </div>
        </div>

      </div>
    </div>
  );
}