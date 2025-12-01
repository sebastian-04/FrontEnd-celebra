import {Component, inject} from '@angular/core';
import {RouterLink} from '@angular/router';
import {BotpressService} from '../../services/botpress-service';

@Component({
  selector: 'app-register',
  imports: [
    RouterLink

  ],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
    botPressService = inject(BotpressService);
    nombre: String = "Iniciar Sesión";
    ngOnInit(): void {
      this.botPressService.destroyChat();
      localStorage.removeItem('token');
    }
}
