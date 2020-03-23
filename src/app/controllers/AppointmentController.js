import * as Yup from 'yup';
import { startOfHour, parseISO, isBefore, format } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Appointment from '../models/Appointment';
import User from '../models/User';
import File from '../models/File';
import Notification from '../schemas/Notification';

class AppointmentController {
  async index(req, res) {
    // Paginacao
    const { page = 1 } = req.query;

    const appointments = await Appointment.findAll({
      where: { user_id: req.userId, canceled_at: null },
      order: ['date'],
      // O limite e offset eh para paginacao. limit eh a qtd de registros por pagina, offset eh a quantidade de registros que vai pular, por isso a conta com a pagina para ele saber da onde comecar a mostrar
      limit: 20,
      offset: (page - 1) * 20,
      attributes: ['id', 'date'],
      // Esse atributo acima esta relacionado aos dados que estao sendo mostrado no apointment.
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['id', 'name'],
          // Ja esses daqui sao referentes ao model User, referente ao provider_id
          include: [
            { model: File, as: 'avatar', attributes: ['id', 'path', 'url'] },
            // e por ultimo, esses atributes agr estao relacionados ao File que esta com o nome de avatar
          ],
        },
      ],
    });

    return res.json(appointments);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      provider_id: Yup.number().required(),
      date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body)))
      return res.status(400).json({ Error: 'Validation Fails' });

    const { provider_id, date } = req.body;

    // Check if provider_id is a provider
    const isProvider = await User.findOne({
      where: { id: provider_id, provider: true },
    });

    if (!isProvider)
      return res
        .status(401)
        .json({ error: 'You can only create appointments with providers' });

    // parseIso transforma a string date em um objeto do java script e ai o objeto date pode ser usado dentro do metodo startOfHour (ele sempre pega o inicio da hora, desconsiderando os minutos)
    const hourStart = startOfHour(parseISO(date));

    // Check for past dates
    // o new Date eh para que ele pegue a data do momento.
    if (isBefore(hourStart, new Date()))
      return res.status(400).json({ error: 'Past dates are not permited' });

    // Check for date available
    const checkAvailability = await Appointment.findOne({
      where: { provider_id, canceled_at: null, date: hourStart },
    });

    if (checkAvailability)
      return res
        .status(400)
        .json({ error: 'Appointment hour/date is not available' });

    if (provider_id === req.userId)
      return res
        .status(401)
        .json({ error: 'Can not schedule appointment with your self' });

    const appointment = await Appointment.create({
      // Lembrando que esse req.userId vem la do login que vc fez usando o JWT.. ele ta embutido no token de seguranca que vc esta usando
      user_id: req.userId,
      provider_id,
      date: hourStart,
    });

    // Notify appointment provider  (banco de dados nao relacional)
    const user = await User.findByPk(req.userId);
    const formattedDate = format(hourStart, "'dia' dd 'de' MMMM', as' H:mm'h", {
      locale: pt,
    });

    await Notification.create({
      content: `Novo agendamento de ${user.name} para o ${formattedDate} `,
      user: provider_id,
    });

    return res.json(appointment);
  }
}

export default new AppointmentController();
