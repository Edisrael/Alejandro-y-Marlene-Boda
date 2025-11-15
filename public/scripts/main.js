// Screen adapter height
var screenHeight = $(window).height() - 150;
$(".screen-adapter").css("height", screenHeight);

// Confirmation system
const scriptURL = "https://script.google.com/macros/s/AKfycbwDANBcHxSuuOPgKcknf8_sbu9NbvFVBwOidMUMeZpVLM9l07GjLDMAi9lqAtZmrFvY7Q/exec";
const params = new URLSearchParams(window.location.search);
const codigo = params.get("cd");
const mensajeDiv = document.getElementById("mensajeInvitado");
const btnConfirmar = document.getElementById("btnConfirmar");
let invitado = null;

if (!codigo) {
	if (mensajeDiv) {
		mensajeDiv.innerHTML = "Código inválido o faltante.";
	}
} else {
	fetch(`${scriptURL}?cd=${codigo}`)
		.then((r) => r.json())
		.then((data) => {
			if (data.error) {
				if (mensajeDiv) {
					mensajeDiv.innerHTML = "Invitado no encontrado.";
				}
			} else {
				invitado = data;

				// Si ya había confirmado antes
				if (data.asistencia === "Confirmado") {
					if (mensajeDiv) {
						mensajeDiv.innerHTML = `
							<b style="font-size:1.4em;">${data.nombre}</b>.<br>
							Tienes <b>${data.boletos}</b> boleto(s) asignado(s) y ya habías confirmado tu asistencia 💕
						`;
					}
					if (btnConfirmar) {
						btnConfirmar.style.display = "none";
					}
					return;
				}

				// Si aún no ha confirmado
				if (mensajeDiv) {
					mensajeDiv.innerHTML = `
						<b style="font-size:1.4em;">${data.nombre}</b>.<br>
						Tienes <b>${data.boletos}</b> boleto(s) asignado(s).<br><br>
						Favor de confirmar tu asistencia.
					`;
				}
				if (btnConfirmar) {
					btnConfirmar.style.display = "inline-block";
				}
			}
		})
		.catch(() => {
			if (mensajeDiv) {
				mensajeDiv.innerHTML = "Error al conectar con el servidor.";
			}
		});
}

if (btnConfirmar) {
	btnConfirmar.addEventListener("click", () => {
		if (!invitado) return;
		btnConfirmar.disabled = true;
		btnConfirmar.innerText = "Enviando...";

		fetch(`${scriptURL}?cd=${codigo}&action=confirmar`)
			.then((r) => r.json())
			.then((res) => {
				if (mensajeDiv) {
					mensajeDiv.innerHTML = `<b style="font-size:1.3em;">${res.mensaje}</b>`;
				}
				btnConfirmar.style.display = "none";
			})
			.catch(() => {
				alert("Error al registrar la confirmación.");
				btnConfirmar.disabled = false;
				btnConfirmar.innerText = "Aceptar invitación";
			});
	});
}

// Document ready functions
$(document).ready(function () {
	// Initialize page
	window.scroll({
		top: 0,
		left: 0,
		behavior: "instant",
	});

	if (document.getElementById("nombrePlayer") !== null) {
		document.getElementById("nombrePlayer").style.height = "40px";
	}

	$(".cbuHead").on("click", function () {
		$(".fixColorWhite").css("z-index", "9999");
	});

	if ($("#modalVencimiento").length) {
		$("#modalVencimiento").modal({
			backdrop: "static",
			keyboard: false,
		});
		$("#modalVencimiento").modal("show");
	}

	setTimeout(() => {
		$("#modalBienvenida").modal("show");
	}, 800);

	$("#boton-modal").click(function () {
		$("#modalBienvenida").modal("hide");
		var audio = document.getElementById("musica");
		audio.play();
		audio.muted = false;
	});

	$("#modalBienvenida").on("click", function () {
		var audio = document.getElementById("musica");
		audio.play();
		audio.muted = false;
	});

	// Menu toggle
	$(".closeMenu").on("click", function (e) {
		$(".adminPanel").hide("fast");
		$(".openMenu").show("fast");
	});

	$(".openMenu").on("click", function (e) {
		$(".adminPanel").show("fast");
		$(".openMenu").hide("fast");
	});

	// VenoBox gallery
	new VenoBox({
		selector: ".my-image-links",
		numeration: true,
		infinigall: true,
		share: true,
		spinner: "rotating-plane",
	});

	$("#slugInput").val($("#invitacion").data("slug"));
	$("#slugPass").val($("#invitacion").data("slug"));

	// Accept/Reject buttons
	$("#btnAceptar").click(function () {
		$("#nombrePass").val("");
		$("#mensajePass").val("");
		$("#mensajePass").attr(
			"placeholder",
			"Puedes comentarnos si tienes alguna restricción alimentaria y también dejar un bonito mensaje en el libro de firmas!",
		);
		$("#cantidadPersonasPass").prop("disabled", false).val();
		$("#asistenciaPass").val("Si");
		$("#confirmar-invi").text("Aceptar invitación");
		$("#groupCantPersonas").show();
		$("#mensajeCancelacion").hide();
		$("#modalAceptar").modal("show");
	});

	$("#btnRechazar").click(function () {
		$("#nombrePass").val("");
		$("#mensajePass").val("");
		$("#mensajePass").attr("placeholder", "");
		$("#cantidadPersonasPass").val(0).prop("disabled", true);
		$("#asistenciaPass").val("No");
		$("#confirmar-invi").text("Rechazar invitación");
		$("#groupCantPersonas").hide();
		$("#mensajeCancelacion").show();
		$("#modalAceptar").modal("show");
	});
});

// Music control functions
function apagarMusica() {
	var audio = document.getElementById("musica");
	console.log("entre audio apagar");
	$("#sonidoMusicaOff").show();
	$("#sonidoMusicaOn").hide();
	audio.pause();
}

$("#sonidomusicaOff").click(function () {
	var audio = document.getElementById("musica");
	console.log("entre audio encender");
	$("#sonidoMusicaOn").show();
	$("#sonidoMusicaOff").hide();
	audio.play();
});

$("#sonidoMusicaOn").click(function () {
	apagarMusica();
});

$("#video-link").click(function () {
	apagarMusica();
});

// Height adjustment functions
function obtenerDivMasAlto(nombreClase, widthMinimo) {
	$(nombreClase).height("auto");
	let alturaMaxima = 0;
	let divMasAlto = null;

	if ($(window).width() <= widthMinimo) {
		$(nombreClase).each(function () {
			const alturaOriginal = $(this).data("altura-original");
			$(this).height(alturaOriginal);
		});
		return null;
	}

	$(nombreClase).each(function () {
		const altura = $(this).outerHeight(true);
		if (altura > alturaMaxima) {
			alturaMaxima = altura;
			divMasAlto = $(this);
		}
	});
	$(nombreClase).height(alturaMaxima);
}

function ejecutarCambiosAlturas() {
	obtenerDivMasAlto(".alturaTarjetas", 768);
	obtenerDivMasAlto(".thumbnail", 575);
}

setTimeout(() => {
	ejecutarCambiosAlturas();
}, 500);

$(window).on("resize", function () {
	ejecutarCambiosAlturas();
});

// Utility functions
function sanitizeFileName(fileName) {
	fileName = fileName.replace(/[^\w\-_.]/g, "_");
	fileName = fileName.trim();
	return fileName;
}

function enviarTrivia() {
	var URLactual = window.location + "/trivia";
	window.location.href = URLactual;
}

// Confetti
const jsConfetti = new JSConfetti();

// VenoBox videos
new VenoBox({
	selector: ".my-video-links",
});

// QR adjustment
function ajustarQR() {
	const qrcodeDiv = document.getElementById("qrcode");
	if (!qrcodeDiv) return;

	const parentDiv = qrcodeDiv.parentElement;

	if (window.innerWidth < 768) {
		parentDiv.classList.add("d-flex", "justify-content-center");
	} else {
		parentDiv.classList.remove("d-flex", "justify-content-center");
	}
}

window.addEventListener("resize", ajustarQR);
ajustarQR();

// Gift box sizing
var tamanioRegalo = $(".cantRecuadros .linkRegaloCuadro").length <= 2 ? "col-md-6" : "col-md-4";
$(".cantRecuadros .linkRegaloCuadro").addClass(tamanioRegalo);

// Save pass movement
function guardarMovimientoPase(idPase, slug, accion, actionMethod, valor) {
	$.ajax({
		type: "POST",
		url: "/invitaciones/controllers/movimientosPases.php",
		data: {
			id: idPase,
			slug: slug,
			accion: accion,
			actionMethod: actionMethod,
			valor: valor,
		},
		success: function (response) {},
		error: function (error) {},
	});
}

if ($("#invitacion").data("idpase")) {
	const idPase = $("#invitacion").data("idpase");
	const slug = $("#invitacion").data("slug");
	const accion = "VIEW";
	const actionMethod = "insertMovimiento";
	guardarMovimientoPase(idPase, slug, accion, actionMethod, null);
}

// Confirmation message length enforcement
function enforceMaxLength(el) {
	if (el.value.length > el.maxLength) {
		el.value = el.value.slice(0, el.maxLength);
	}
}

// Reconfirmation and acceptance logic
$("#reconfirmar").click(function () {
	$("#div_reconfirmar").hide();
	$("#divConfirmacion").css("display", "flex");
});

$("#confirmar-invi").on("click", function () {
	setTimeout(() => {
		let texto = "asistiras";
		let color = "green";
		let texto_btn = '"Aceptar invitación"';
		if ($("#asistenciaPass").val() == "No") {
			texto = "no asistiras";
			color = "red";
			let texto_btn = '"Rechazar invitación"';
			$("#txt-cant").hide();
		} else {
			$("#txt-cant").show();
		}
		$("#text-confirm-valor").css("color", color);
		$("#text-confirm-valor").text(texto);
		$("#text-confirm-fecha").text(formatDate(Date.now()));
		$("#text-confirm-cant").text($("#cantidadPersonasPass").val());
		$("#divConfirmacion").hide();
		$("#div_reconfirmar").show();
		$("#modalAceptar").modal("hide");
		$("#confirmar-invi").text(texto_btn);
	}, 4000);
});

function formatDate(date) {
	var d = new Date(date),
		day = "" + d.getDate(),
		month = "" + (d.getMonth() + 1),
		year = d.getFullYear();

	if (day.length < 2) day = "0" + day;
	if (month.length < 2) month = "0" + month;

	return [day, month, year].join("/");
}

// Background color styling for wedding info sections
$(document).ready(function () {
	$("#wedding-info .wraper-we letraSecundaria").css(
		"background-color",
		"rgba(249, 249, 248, 0.51)",
	);
	$("#wedding-info .wraper-we2 letraSecundaria").css(
		"background-color",
		"none !important",
	);
	$(".otros-hoteles-bk").css(
		"background-color",
		"rgba(249, 249, 248, 0.51)",
	);
	$(".cbuBox").css("background-color", "none !important");
});

// Ceremony section styling
$(document).ready(function () {
	$(".bgCeremoonias").css(
		"background-color",
		"rgba(249, 249, 248, 0.51) !important",
	);
});

// Bridsmaid/groosman thumbnail styling
$(document).ready(function () {
	$("#bridsmaid-groosman-content .thumbnail").css(
		"background-color",
		"rgba(249, 249, 248, 0.01) !important",
	);
});

// tsParticles initialization
$(document).ready(async function () {
	// tsParticles.load("tsparticles",'efecto.json') ;
	//$("#tsparticles").particles();
});
