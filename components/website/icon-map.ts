import {
  Scale, Shield, FileText, Gavel, Award, TrendingUp,
  MapPin, Phone, Mail, Clock, Users, Briefcase,
  Building2, BookOpen, Star, Heart, Target, Zap,
  Lock, Eye, MessageSquare, Globe, type LucideIcon,
} from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  Scale,
  Shield,
  FileText,
  Gavel,
  Award,
  TrendingUp,
  MapPin,
  Phone,
  Mail,
  Clock,
  Users,
  Briefcase,
  Building2,
  BookOpen,
  Star,
  Heart,
  Target,
  Zap,
  Lock,
  Eye,
  MessageSquare,
  Globe,
}

export function getIcon(name: string): LucideIcon {
  return iconMap[name] || Shield
}
