import { useState, useEffect } from "react";
import { useAuth } from "../config/Auth";
import { socket } from "../config/socket";
import { Dialog } from "@headlessui/react";
import * as XLSX from "xlsx";

export default function Admin() {
  const { account, setAccount } = useAuth();

  const [tema, setTema] = useState("");
  const [nombre, setNombre] = useState("");
  const [delegacion, setDelegacion] = useState("");
  const [minutos, setMinutos] = useState(3);

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

  const odd = [
    {
      titulo: "1. Aprobación, si procede, del orden del día.",
    },
    {
      titulo:
        "2. Aprobación, si procede, del acta de la asamblea general anterior.",
    },
    {
      titulo: "3. Lectura y puesta en conocimiento de documentación relevante.",
    },
    {
      titulo:
        "4. Ratificación, si procede, del nuevo modelo de acreditaciones.",
    },
    {
      titulo:
        "5. Punto de información sobre el estado de las cuentas de la asociación.",
    },
    {
      titulo: "6. Informe de la Presidencia",
    },
  ];

  const representantes = [
    { nombre: "Olga", delegacion: "UPV" },
    { nombre: "David", delegacion: "Secretaría" },
    { nombre: "Susi", delegacion: "UC3M" },
    { nombre: "Marcos", delegacion: "UEx" },
    { nombre: "José Antonio", delegacion: "UEx" },
    { nombre: "Julio", delegacion: "UC" },
    { nombre: "Vera", delegacion: "UPV" },
    { nombre: "Raúl", delegacion: "UPM" },
  ];

  useEffect(() => {
    socket.on("estadoActualizado", (estado) => {
      setAsamblea(estado);
      setConectado(true);
    });

    socket.on("tiempo", (t) => setTiempo(t));

    socket.on("recibirExportacion", (data) => {
      if (!data || data.length === 0) {
        alert("No hay turnos ejecutados para exportar.");
        return;
      }

      const datosExcel = data.map((item) => ({
        Nombre: item.nombre || "",
        Delegación: item.delegacion || "",
        Tema: item.tema || "",
        Intervención: item.intervencion || "",
        Minutos: item.minutos || 0,
        "Fecha/Hora de Petición": item.tiempo_peticion || "",
      }));

      const worksheet = XLSX.utils.json_to_sheet(datosExcel);

      worksheet["!cols"] = [
        { wch: 20 }, // Ancho para Nombre
        { wch: 15 }, // Ancho para Delegación
        { wch: 50 }, // Ancho para Tema
        { wch: 35 }, // Ancho para Intervención
        { wch: 10 }, // Ancho para Minutos
        { wch: 25 }, // Ancho para Fecha/Hora
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Historial");

      const fecha = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(workbook, `HistorialAsamblea_${fecha}.xlsx`);
    });

    socket.emit("pedirUpdate");

    return () => {
      socket.off("estadoActualizado");
      socket.off("tiempo");
    };
  }, []);

  const cambiarTema = (e) => {
    e.preventDefault();
    if (!tema.trim()) return;

    socket.emit("actualizarTema", {
      tema: tema,
      archivo: null,
    });

    setTema("");
    toggleOpen("tema");
  };

  const cambiarTiempo = (e) => {
    e.preventDefault();

    socket.emit("cambiarTiempo", {
      minutos: minutos,
    });

    setMinutos(0);
    toggleOpen("tiempo");
  };

  const filtroRepresentante = (e) => {
    let representante = e.split(" - ");
    setNombre(representante[0]);
    setDelegacion(representante[1]);
  };

  const agregarTurno = (intervencion) => {
    if (!nombre.trim() || !delegacion.trim())
      return alert("Falta nombre o delegación");

    const prioridades = {
      "Punto de orden": 6,
      "Apunte técnico": 5,
      "Punto de información": 4,
      "Respuesta por alusión directa": 3,
      "Respuesta normal": 2,
      Intervención: 1,
    };

    socket.emit("agregarTurno", {
      tema: tema,
      nombre: nombre,
      delegacion: delegacion,
      intervencion: intervencion,
      prioridad: prioridades[intervencion],
      minutos: minutos,
      solicitud: false,
      hablando: false,
      ejecutado: false,
      // que hay de los demás atributos???
    });

    setNombre("");
    setDelegacion("");
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const terminarTurno = () => {
    socket.emit("terminarTurno");
  };

  const cerrarSesion = (e) => {
    e.preventDefault();
    localStorage.removeItem("ceettoken");
    setAccount(null);
  };

  const exportarHistorial = () => {
    socket.emit("exportarHistorial");
  };

  const [isOpen, setIsOpen] = useState({
    tema: false,
    tiempo: false,
    turnoManual: false,
  });

  const toggleOpen = (id) => {
    setIsOpen((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
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

      <div className="flex-row gap-3 grid grid-cols-5 px-4">
        <button
          className="col-span-1 border border-ceet font-ceet bg-ceet text-white h-12 rounded-md font-bold"
          type="button"
          onClick={() => {
            toggleOpen("tema");
          }}
        >
          Cambiar tema
        </button>

        <button
          type="button"
          className="col-span-1 border border-ceet font-ceet bg-ceet text-white h-12 rounded-md font-bold"
          onClick={() => {
            toggleOpen("tiempo");
          }}
        >
          Cambiar tiempo
        </button>

        <button
          type="button"
          className="col-span-1 border border-ceet font-ceet bg-ceet text-white h-12 rounded-md font-bold"
          onClick={() => {
            toggleOpen("turnoManual");
          }}
        >
          Añadir turno
        </button>

        <div>
          <span>
            {asamblea.turnoAbierto ? (
              <button
                type="button"
                className="col-span-1 border border-ceet font-ceet bg-ceet text-white h-12 rounded-md font-bold"
                onClick={() => socket.emit("cerrarTurno")}
              >
                Cerrar Turno
              </button>
            ) : (
              <button
                type="button"
                className="col-span-1 border border-ceet font-ceet bg-ceet text-white h-12 rounded-md font-bold"
                onClick={() => socket.emit("abrirTurno")}
              >
                Abrir Turno
              </button>
            )}
          </span>
        </div>
        <button
          type="button"
          className="col-span-1 border border-ceet font-ceet bg-white text-ceet h-12 rounded-md font-bold"
          onClick={exportarHistorial}
        >
          Exportar Historial
        </button>
      </div>

      {/* <Transition show={isOpen} enter="transition duration-100 ease-out" enterFrom="transform scale-95 opacity-0" enterTo="transform scale-100 opacity-100" leave="transition duration-75 ease-out" leaveFrom="transform scale-100 opacity-100" leaveTo="transform scale-95 opacity-0" as={Fragment}> */}

      <Dialog
        open={isOpen["tema"]}
        onClose={() => toggleOpen("tema")}
        className="relative z-50"
      >
        <div
          className="fixed inset-0 bg-black/30 font-ceet"
          aria-hidden="true"
        />
        <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
          <Dialog.Panel className="mx-auto w-500 h-50 max-w-md max-h-md rounded bg-white">
            <form
              onSubmit={(e) => {
                cambiarTema(e);
              }}
              className="flex flex-col justify-center items-center w-full h-full p-5 gap-2"
            >
              <h3 className="font-ceet text-ceet">Cambiar tema</h3>
              <h2 className="font-ceet text-ceet">
                {`Tema actual: ${asamblea.tema}` || "Sin tema seleccionado"}
              </h2>
              <input
                type="text"
                list="listaTemas"
                value={tema}
                className="h-15 border border-ceet w-full text-ceet font-ceet text-center gap-5 rounded-md"
                onChange={(e) => setTema(e.target.value)}
                placeholder="Escribe o selecciona el tema"
              />
              <datalist id="listaTemas">
                {odd.map((t, i) => (
                  <option key={i} value={t.titulo} />
                ))}
              </datalist>
              <div className="mt-4 flex flex-row justify-center items-end gap-2">
                <button
                  type="button"
                  onClick={() => toggleOpen("tema")}
                  className="px-4 py-2 text-sm font-ceet text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-ceet text-white bg-ceet rounded-md hover:bg-blue-600"
                >
                  Guardar
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
      {/* </Transition> */}

      <Dialog
        open={isOpen["tiempo"]}
        onClose={() => toggleOpen("tiempo")}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
          <Dialog.Panel className="mx-auto w-500 h-50 max-w-md max-h-md rounded bg-white flex flex-col justify-center items-center">
            <h3 className="font-ceet text-ceet">Cambiar tiempo</h3>
            <form onSubmit={(e) => cambiarTiempo(e)}>
              <select
                id="min"
                className="font-ceet text-ceet"
                onChange={(e) => setMinutos(e.target.value)}
              >
                <option value="null">Sin duración</option>
                <option value="0.5">30s</option>
                <option value="1">1 min</option>
                <option value="5">5 min</option>
              </select>

              <button className="font-ceet text-ceet" type="submit">
                Enviar
              </button>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>

      <Dialog
        open={isOpen["turnoManual"]}
        onClose={() => toggleOpen("turnoManual")}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
          <Dialog.Panel className="mx-auto w-500 h-50 max-w-md max-h-md rounded bg-white flex flex-col justify-center items-center">
            <form className="font-ceet text-ceet flex flex-col justify-center items-center gap-2">
              <h3>Agregar manualmente a un representante</h3>
              <input
                type="text"
                list="listaRepresentantes"
                onChange={(e) => filtroRepresentante(e.target.value)}
                placeholder="Representante"
                className="border border-ceet rounded-md"
              />
              <datalist id="listaRepresentantes">
                {representantes.map((r, i) => (
                  <option key={i} value={`${r.nombre} - ${r.delegacion}`} />
                ))}
              </datalist>

              <br />

              <select
                value={minutos}
                onChange={(e) => setMinutos(Number(e.target.value))}
                className="border border-ceet rounded-md"
              >
                <option value="null">Sin duración</option>
                <option value="0.5">30s</option>
                <option value="1">1 min</option>
                <option value="5">5 min</option>
              </select>

              <br />
              <div className="flex flex-row justify-center items-center">
                <button
                  type="reset"
                  onClick={() => agregarTurno("Punto de orden")}
                >
                  Punto de orden
                </button>
                <button
                  type="reset"
                  onClick={() => agregarTurno("Apunte técnico")}
                >
                  Apunte técnico
                </button>
                <button
                  type="reset"
                  onClick={() => agregarTurno("Punto de información")}
                >
                  Punto de información
                </button>
                <button
                  type="reset"
                  onClick={() => agregarTurno("Respuesta por alusión directa")}
                >
                  Respuesta por alusión directa
                </button>
                <button
                  type="reset"
                  onClick={() => agregarTurno("Respuesta normal")}
                >
                  Respuesta normal
                </button>
                <button
                  type="reset"
                  onClick={() => agregarTurno("Intervención")}
                >
                  Intervención
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>

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

      <div className="w-full py-2 flex-col justify-center overflow-hidden px-4 gap-2 rounded-md grid grid-cols-10">
        <div className="py-4 border border-ceet rounded-md col-span-8">
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
        <div className="py-4 border border-ceet rounded-md col-span-2 flex flex-col justify-center items-center">
          <button
            onClick={() => terminarTurno()}
            className="font-ceet text-ceet h-full"
          >
            Terminar turno
          </button>
        </div>
      </div>

      <div className=" flex flex-col gap-3 w-full h-10 justify-between items-center px-4">
        {asamblea.turnoAbierto ? (
          <h2 className="font-ceet text-ceet flex flex-col justify-center items-center">
            Turnos (ABIERTO)
          </h2>
        ) : (
          <h2 className="font-ceet text-ceet flex flex-col justify-center items-center">
            Turnos (CERRADO)
          </h2>
        )}
      </div>

      <div className="flex flex-col gap-5 p-4 w-full">
        {asamblea.turnos
          .filter((turno) => !turno.hablando)
          .map((turno, index) => (
            <div className="flex flex-row w-full gap-1" key={turno.id}>
              <div className="grid grid-cols-8 gap-3 w-full h-10 justify-between items-center">
                <div className="h-full flex flex-col justify-center items-center font-semibold bg-ceet text-white border border-ceet col-span-1">
                  {index + 1}.
                </div>
                <div className="h-full flex flex-col justify-center items-center font-ceet text-ceet font-bold border border-ceet col-span-2">
                  {turno.nombre} - {turno.delegacion}
                </div>
                <div className="h-full flex flex-col justify-center items-center font-ceet text-ceet border border-ceet col-span-3">
                  {turno.intervencion}
                </div>
                <button
                  className="border border-ceet font-ceet text-black h-full col-span-1"
                  type="button"
                  onClick={() => socket.emit("darPalabra", turno.id)}
                >
                  Dar la palabra
                </button>
                <button
                  className="border border-red-800 font-ceet text-red-800 h-full col-span-1"
                  type="button"
                  onClick={() => socket.emit("eliminarTurno", turno.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
