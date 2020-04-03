import { startOfDay, endOfDay, parseISO } from 'date-fns';
import { Op } from 'sequelize';
import Appointment from '../models/Appointment';
import User from '../models/User';

class ScheduleController {
  async index(req, res) {
    const checkUserProvider = await User.findOne({
      where: { id: req.userId, provider: true },
    });

    if (!checkUserProvider)
      return res.status(401).json({ error: 'user is not a provider' });

    const { date } = req.query;
    const parsedDate = parseISO(date);

    const appointments = await Appointment.findAll({
      where: {
        provider_id: req.userId,
        canceled_at: null,
        // Start of date vai pegar o primerio horario do dia 00:00:00 e o end o ultimo 23:59:59
        // op.between eh do sequelize para poder fazer essa verificacao de o que estra no meio
        // Vc poderia usar apenas o between mas como boa pratica eh bom usar esse Op que eh de operador
        date: { [Op.between]: [startOfDay(parsedDate), endOfDay(parsedDate)] },
      },
      include: [{ model: User, as: 'user', attributes: ['name'] }],
      order: ['date'],
    });

    return res.json(appointments);
  }
}

export default new ScheduleController();
