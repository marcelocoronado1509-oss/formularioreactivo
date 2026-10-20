import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonText,
  IonDatetime,
  IonSpinner,
  IonIcon,
  ToastController
} from '@ionic/angular';

import { addIcons } from 'ionicons';
import {
  moonOutline,
  sunnyOutline,
  downloadOutline,
  calendarOutline
} from 'ionicons/icons';

import { jsPDF } from 'jspdf';

interface DatosRegistro {
  nombre: string;
  email: string;
  fecha: string;
}

@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonText,
    IonDatetime,
    IonSpinner,
    IonIcon,
  ]
})
export class RegistroPage {
  private fb = inject(FormBuilder);
  private toastController = inject(ToastController);

  registroForm: FormGroup;
  isSubmitting = signal(false);
  modoOscuro = signal(false);

  fechaMinima = this.obtenerFechaLocal();

  ultimoRegistro: DatosRegistro | null = null;

  constructor() {
    addIcons({
      moonOutline,
      sunnyOutline,
      downloadOutline,
      calendarOutline
    });

    this.registroForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [
          Validators.required,
          Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/)
        ]
      ],
      fecha: [
        this.fechaMinima,
        [Validators.required, this.validarFechaNoAnterior.bind(this)]
      ]
    });
  }

  // ...el resto de métodos se queda igual

  private validarFechaNoAnterior(
    control: AbstractControl
  ): ValidationErrors | null {
    if (!control.value) {
      return null;
    }

    const fechaSeleccionada = String(control.value).substring(0, 10);

    return fechaSeleccionada < this.fechaMinima
      ? { fechaAnterior: true }
      : null;
  }

  private obtenerFechaLocal(): string {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
  }

  // Cifrado SHA-256 con la Web Crypto API
  private async cifrar(texto: string): Promise<string> {
    const datos = new TextEncoder().encode(texto);
    const hash = await crypto.subtle.digest('SHA-256', datos);

    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  async onSubmit(): Promise<void> {
    if (this.registroForm.invalid) {
      this.registroForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    try {
      // Simulación de envío. Aquí podrías conectar tu API.
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const valores = this.registroForm.getRawValue();

      // La contraseña nunca se muestra en texto plano
      const passwordCifrada = await this.cifrar(valores.password);

      console.log('Registro enviado:', {
        nombre: valores.nombre,
        email: valores.email,
        password: passwordCifrada
      });

      // No guardamos la contraseña para el PDF.
      this.ultimoRegistro = {
        nombre: valores.nombre,
        email: valores.email,
        fecha: String(valores.fecha).substring(0, 10)
      };

      this.registroForm.reset({
        nombre: '',
        email: '',
        password: '',
        fecha: this.fechaMinima
      });

      await this.mostrarToast('¡Registro enviado correctamente!', 'success');
    } catch (error) {
      console.error('Error al enviar el registro.');
      await this.mostrarToast('No se pudo enviar el registro.', 'danger');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async mostrarToast(
    mensaje: string,
    color: 'success' | 'danger'
  ): Promise<void> {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2500,
      position: 'bottom',
      color,
      buttons: [{ text: 'Cerrar', role: 'cancel' }]
    });

    await toast.present();
  }

  cambiarTema(): void {
    const nuevoModo = !this.modoOscuro();

    this.modoOscuro.set(nuevoModo);
    document.body.classList.toggle('dark', nuevoModo);
  }

  descargarPDF(): void {
    if (!this.ultimoRegistro) {
      return;
    }

    const datos = this.ultimoRegistro;

    const pdf = new jsPDF();
    pdf.setFontSize(18);
    pdf.text('Comprobante de registro', 20, 25);

    pdf.setFontSize(12);
    pdf.text(`Nombre: ${datos.nombre}`, 20, 45);
    pdf.text(`Correo: ${datos.email}`, 20, 55);
    pdf.text(`Fecha de registro: ${datos.fecha}`, 20, 65);

    pdf.save('comprobante-registro.pdf');
  }
}