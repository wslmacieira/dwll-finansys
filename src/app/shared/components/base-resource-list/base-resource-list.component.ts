import {Directive, OnInit } from '@angular/core';

import { BaseResourceModel } from "../../models/base-resource.model";
import { BaseResourceService } from "../../services/base-resource.service";

@Directive()
export abstract class BaseResourceListComponent<T extends BaseResourceModel> implements OnInit {

  resources: T[] = [];

  constructor(private baseService: BaseResourceService<T>) { }

  ngOnInit(): void {
    this.baseService.getAll().subscribe(
      resources => this.resources = resources.sort((a,b) => Number(b.id) - Number(a.id)),
      error => alert('Erro ao carregar a lista')
    )
  }

  deleteResource(resource: T) {
    const mustDelete = confirm('Deseja realmente excluir este item?')

    if(mustDelete) {
      this.baseService.delete(resource.id ?? 0).subscribe(
        () => this.resources = this.resources.filter(element => element != resource),
        () => alert('Erro ao tentar excluir!')
      )
    }
  }

}
