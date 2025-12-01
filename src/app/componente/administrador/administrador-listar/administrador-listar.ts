import {Component, inject, ViewChild} from '@angular/core';
import {Administrador} from "../../administrador-header/administrador";
import {AdministradorNavBar} from '../administrador-nav-bar/administrador-nav-bar';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow, MatHeaderRowDef, MatRow, MatRowDef,
  MatTable, MatTableDataSource
} from '@angular/material/table';
import {RouterLink} from '@angular/router';
import {MatButton} from '@angular/material/button';
import {MatPaginator} from '@angular/material/paginator';
import {MatToolbar, MatToolbarRow} from '@angular/material/toolbar';
import {TipoEvento} from '../../../model/tipoEvento';
import {Especializacion} from '../../../model/especializacion';
import {Ciudad} from '../../../model/ciudad';
import {Distrito} from '../../../model/distrito';
import {TipoEventoServices} from '../../../services/tipo-evento-services';
import {EspecializacionServices} from '../../../services/especializacion-services';
import {DistritoServices} from '../../../services/distrito-services';
import {CiudadServices} from '../../../services/ciudad-services';
import {MatDialog} from '@angular/material/dialog';
import {MatSort} from '@angular/material/sort';
import {ConfirmDialog} from './confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-administrador-listar',
  imports: [
    Administrador,
    AdministradorNavBar,
    MatTable,
    MatHeaderCell,
    MatHeaderCellDef,
    MatCell,
    MatCellDef,
    MatColumnDef,
    RouterLink,
    MatButton,
    MatHeaderRow,
    MatHeaderRowDef,
    MatRow,
    MatRowDef,
    MatPaginator,
    MatToolbar,
    MatToolbarRow,
    MatSort
  ],
  templateUrl: './administrador-listar.html',
  styleUrl: './administrador-listar.css',
})
export class AdministradorListar {
  dataSourceTipoEvento = new MatTableDataSource<TipoEvento>;
  dataSourceEspecializacion = new MatTableDataSource<Especializacion>;
  dataSourceCiudad = new MatTableDataSource<Ciudad>;
  dataSourceDistrito = new MatTableDataSource<Distrito>;
  displayedColumnsTipoEvento = ["id", "nombre", "accion1", "accion2"];
  displayedColumnsEspecializacion = ["id", "nombre", "accion1", "accion2"];
  displayedColumnsCiudad = ["id", "nombre", "accion1", "accion2"];
  displayedColumnsDistrito = ["id", "ciudad", "nombre", "accion1", "accion2"];
  entidad = "";
  tipoEventoService = inject(TipoEventoServices);
  especializacionService = inject(EspecializacionServices);
  distritoService = inject(DistritoServices);
  ciudadService = inject(CiudadServices);
  dialog: MatDialog = inject(MatDialog);
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  ngAfterViewInit() {
    this.dataSourceCiudad.paginator = this.paginator;
    this.dataSourceCiudad.sort = this.sort;
    this.dataSourceDistrito.paginator = this.paginator;
    this.dataSourceDistrito.sort = this.sort;
    this.dataSourceEspecializacion.paginator = this.paginator;
    this.dataSourceEspecializacion.sort = this.sort;
    this.dataSourceTipoEvento.sort = this.sort;
    this.dataSourceTipoEvento.paginator = this.paginator;
  }
  ngOnInit() {
    if (this.entidad == "") {
      this.seleccionar('TipoEvento');
    }
    this.ciudadService.listar().subscribe(data =>{
      console.log("Se han cargado exitosamente las ciudades");
      this.dataSourceCiudad.data = data;
      this.dataSourceCiudad._updateChangeSubscription();
    })
    this.especializacionService.listar().subscribe(data =>{
      console.log("Se han cargado exitosamente las especializaciones")
      this.dataSourceEspecializacion.data = data;
      this.dataSourceEspecializacion._updateChangeSubscription();
    })
    this.distritoService.listar().subscribe(data =>{
      console.log("Se han cargado exitosamente los distritos");
      this.dataSourceDistrito.data = data;
      this.dataSourceDistrito._updateChangeSubscription();
    })
    this.tipoEventoService.listar().subscribe(data =>{
      console.log("Se han cargado exitosamente los tipos de evento");
      this.dataSourceTipoEvento.data = data;
      this.dataSourceTipoEvento._updateChangeSubscription();
    })
  }
  seleccionar(nombre: string){
    this.entidad = nombre;
    console.log("Entidad seleccionada:", this.entidad);
  }
  openDialog(id: number) {
    const dialogRef = this.dialog.open(ConfirmDialog);
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (this.entidad == "TipoEvento") {
          this.tipoEventoService.delete(id).subscribe({
            next: result => {
              alert("Tipo de evento eliminado exitosamente.");
              this.ngOnInit();
            },
            error: err => {
              const mensaje = err?.error?.message?.toString() || "";
              const esFK =
                err.status === 400 &&
                (
                  mensaje.includes("llave foránea") || mensaje.includes("viola") || mensaje.includes("referida") || mensaje.includes("foreign") || mensaje.includes("constraint")
                );
              if (esFK) {
                alert("No se puede eliminar: este distrito está asociado a otros registros.");
                return;
              }
              alert("Ocurrió un error inesperado al eliminar distrito.");
              console.error(err);
            }
          })
        } else if (this.entidad == "Especializacion") {
          this.especializacionService.delete(id).subscribe({
            next: result => {
              alert("Especializacion eliminado exitosamente.");
              this.ngOnInit();
            },
            error: err => {
              const mensaje = err?.error?.message?.toString() || "";
              const esFK =
                err.status === 400 &&
                (
                  mensaje.includes("llave foránea") || mensaje.includes("viola") || mensaje.includes("referida") || mensaje.includes("foreign") || mensaje.includes("constraint")
                );
              if (esFK) {
                alert("No se puede eliminar: este distrito está asociado a otros registros.");
                return;
              }
              alert("Ocurrió un error inesperado al eliminar distrito.");
              console.error(err);
            }
          })
        } else if (this.entidad == "Ciudad") {
          this.ciudadService.delete(id).subscribe({
            next: result => {
              alert("Ciudad eliminada exitosamente.");
              this.ngOnInit();
            },
            error: err => {
              const mensaje = err?.error?.message?.toString() || "";
              const esFK =
                err.status === 400 &&
                (
                  mensaje.includes("llave foránea") || mensaje.includes("viola") || mensaje.includes("referida") || mensaje.includes("foreign") || mensaje.includes("constraint")
                );
              if (esFK) {
                alert("No se puede eliminar: este distrito está asociado a otros registros.");
                return;
              }
              alert("Ocurrió un error inesperado al eliminar distrito.");
              console.error(err);
            }
          })
        } else if (this.entidad == "Distrito") {
          this.distritoService.delete(id).subscribe({
            next: result => {
              alert("Distrito eliminado exitosamente.");
              this.ngOnInit();
            },
            error: err => {
              const mensaje = err?.error?.message?.toString() || "";
              const esFK =
                err.status === 400 &&
                (
                  mensaje.includes("llave foránea") || mensaje.includes("viola") || mensaje.includes("referida") || mensaje.includes("foreign") || mensaje.includes("constraint")
                );
              if (esFK) {
                alert("No se puede eliminar: este distrito está asociado a otros registros.");
                return;
              }
              alert("Ocurrió un error inesperado al eliminar distrito.");
              console.error(err);
            }
          })
        }
      } else {
        console.log("El usuario no quizo eliminar la entidad.");
      }
    })
  }
}
