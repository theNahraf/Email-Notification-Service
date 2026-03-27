import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user';

@Entity('smtp_configs')
export class SmtpConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId: string;

  @Column({ name: 'smtp_host', type: 'varchar', length: 255, default: 'smtp.gmail.com' })
  smtpHost: string;

  @Column({ name: 'smtp_port', type: 'int', default: 587 })
  smtpPort: number;

  @Column({ name: 'smtp_secure', type: 'boolean', default: false })
  smtpSecure: boolean;

  @Column({ name: 'smtp_user', type: 'varchar', length: 255 })
  smtpUser: string;

  @Column({ name: 'smtp_pass', type: 'text' })
  smtpPass: string; // Encrypted at rest

  @Column({ name: 'email_from', type: 'varchar', length: 255 })
  emailFrom: string;

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
