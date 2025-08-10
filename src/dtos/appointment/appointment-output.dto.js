/**
 * DTO de salida de Cita (AppointmentOutputDto).
 * - Formatea los datos de una cita antes de enviarlos al cliente.
 * - Incluye información del paciente (usuario registrado o invitado),
 *   así como la disponibilidad y el tipo de servicio usando sus propios DTOs.
 */
// This DTO depends on other output DTOs to format nested data.
const ServiceTypeOutputDto = require("../service-type/service-type-output.dto");
const AvailabilityOutputDto = require("../availability/availability-output.dto");

// A simple DTO for the patient information (can be a registered user or a guest).
class PatientOutputDto {
  constructor(userOrGuest) {
    this.id = userOrGuest.id;
    this.name = userOrGuest.name;
    this.email = userOrGuest.email;
    this.phone = userOrGuest.phone || null; // Guest has phone, User model also has it
  }
}

/**
 * Data Transfer Object for formatting the detailed appointment data sent to the client.
 */
class AppointmentOutputDto {
  constructor(appointmentModel) {
    // Campos básicos de la cita
    this.id = appointmentModel.id;
    this.status = appointmentModel.status;
    this.notes = appointmentModel.notes;
    this.createdAt = appointmentModel.createdAt;

    // Determina el tipo de paciente y lo formatea
    if (appointmentModel.user) {
      this.patient = new PatientOutputDto(appointmentModel.user);
      this.patientType = "registered";
    } else if (appointmentModel.guestPatient) {
      this.patient = new PatientOutputDto(appointmentModel.guestPatient);
      this.patientType = "guest";
    }

    // Formatea disponibilidad anidada (simplificada en este contexto)
    if (appointmentModel.availability) {
      // Note: We use a simplified availability output here for brevity in the appointment context.
      // A full AvailabilityOutputDto could be used if more detail is needed.
      this.availability = {
        id: appointmentModel.availability.id,
        date: appointmentModel.availability.date,
        startTime: appointmentModel.availability.start_time,
        endTime: appointmentModel.availability.end_time,
        dentist: appointmentModel.availability.dentist
          ? {
              id: appointmentModel.availability.dentist.id,
              name: appointmentModel.availability.dentist.name,
            }
          : null,
      };
    }

    // Tipo de servicio anidado usando su propio DTO
    if (appointmentModel.serviceType) {
      this.serviceType = new ServiceTypeOutputDto(appointmentModel.serviceType);
    }
  }

  static fromList(appointmentsList) {
    return appointmentsList.map((apt) => new AppointmentOutputDto(apt));
  }
}

module.exports = AppointmentOutputDto;
