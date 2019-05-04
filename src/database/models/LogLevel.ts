import { Entity, Column, UpdateDateColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class LogLevel {

  @Column({
    nullable: false,
    primary: true,
    length: 128,
  })
  service: string;


  @Column({
    nullable: false,
    length: 64,
  })
  level: string;


  @CreateDateColumn({ nullable: false })
  created: Date;

  @UpdateDateColumn({ nullable: false })
  updated: Date;


}
