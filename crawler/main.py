import datetime
import logging
import signal
import sys

from apscheduler.events import EVENT_JOB_ERROR, EVENT_JOB_EXECUTED
from apscheduler.executors.pool import ThreadPoolExecutor
from apscheduler.schedulers.blocking import BlockingScheduler

from session import Session
from power import Power
from student import Student


class Scheduler(BlockingScheduler):
    def __init__(self, **options):
        super().__init__(**options)
        self.exit = False
        self.retry_job: dict[str, bool] = {}


class LoggingLevelFilter(logging.Filter):
    def __init__(self, levels: set[int], pass_: bool):
        super().__init__()
        self.levels = levels
        self.pass_ = pass_

    def filter(self, record) -> bool:
        # if self.pass_:
        #     return record.levelno in self.levels
        # else:
        #     return record.levelno not in self.levels
        return self.pass_ == (record.levelno in self.levels)


def logger_patch():
    h1 = logging.StreamHandler(sys.stdout)
    h1.addFilter(LoggingLevelFilter({logging.INFO, logging.DEBUG}, True))

    h2 = logging.StreamHandler(sys.stderr)
    h2.addFilter(LoggingLevelFilter({logging.INFO, logging.DEBUG}, False))

    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s.%(msecs)06d<%(name)s>[%(levelname)s](%(thread)d): %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S',
        handlers=[h1, h2],
    )


def job_listener(event):
    if scheduler.exit:
        return
    job = scheduler.get_job(event.job_id)
    if job.id == "power":
        if not event.exception:
            if scheduler.retry_job[job.id]:
                scheduler._logger.info(f"{job.name} 任务正常结束，执行周期恢复为 每小时一次")
                # 每小时一次
                scheduler.reschedule_job(
                    job.id,
                    trigger='cron',
                    minute='0',
                )
        else:
            scheduler._logger.warning(f"{job.name} 任务异常结束，执行周期设置为 每分钟一次")
            scheduler.retry_job[job.id] = True
            # 每分钟一次
            scheduler.reschedule_job(
                job.id,
                trigger='cron',
                minute='*',
            )
    elif job.id == "student":
        if not event.exception:
            if scheduler.retry_job[job.id]:
                scheduler._logger.info(f"{job.name} 任务正常结束，执行周期恢复为 每周一一次")
                # 每周一一次
                scheduler.reschedule_job(
                    job.id,
                    trigger='cron',
                    day_of_week='mon',
                )
        else:
            scheduler._logger.warning(f"{job.name} 任务异常结束，执行周期恢复为 每小时一次")
            scheduler.retry_job[job.id] = False
            # 每小时一次
            scheduler.reschedule_job(
                job.id,
                trigger='cron',
                minute='0',
            )


def shutdown(signum=None, frame=None):
        scheduler._logger.info("收到结束信号，清除所有任务")
        scheduler.remove_all_jobs()
        scheduler.exit = True
        scheduler._logger.info("收到结束信号，等待剩余任务结束")
        scheduler.shutdown(wait=True)


def main():
    signal.signal(signal.SIGTERM, shutdown)
    signal.signal(signal.SIGINT, shutdown)

    scheduler.retry_job = {"power": False, "student": False}
    scheduler._logger = logging.getLogger("任务")
    scheduler.add_listener(job_listener, EVENT_JOB_ERROR | EVENT_JOB_EXECUTED)

    session = Session()
    power = Power(session)
    scheduler.add_job(
        id="power",
        name="爬取电量信息",
        func=power.run,
        trigger='cron',
        minute='0',
        coalesce=True,
        max_instances=1,
        next_run_time=datetime.datetime.now(),
        replace_existing=True,
    )
    student = Student(session)
    scheduler.add_job(
        id="student",
        name="爬取学生信息",
        func=student.run,
        trigger='cron',
        day_of_week='mon',
        coalesce=True,
        max_instances=1,
        next_run_time=datetime.datetime.now(),
        replace_existing=True,
    )

    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        shutdown()


if __name__ == '__main__':
    logger_patch()

    scheduler = Scheduler(executors={
        'default': ThreadPoolExecutor(2),
    })

    main()
