import {
    FC,
    MouseEventHandler,
    TouchEventHandler,
    useEffect,
    useMemo,
    useRef,
    useState,
  } from 'react';
  import { App, Flex } from 'antd';
  import { useTranslation } from 'react-i18next';
  
  import { useResize } from '@/hooks';
  import { Button } from '@/shared/UI/Button';
  import { Message } from '@/shared/UI/Message';
  import { Modal, ModalProps } from '@/shared/UI/Modal';
  
  import styles from './DrawModal.module.scss';
  
  interface DrawModalProps extends ModalProps {
    handleClose: () => void;
    handleFinish: (file: File) => void;
  }
  
  export const DrawModal: FC<DrawModalProps> = ({ handleClose, handleFinish, ...rest }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isMousePressed = useRef(false);
    const [x, setX] = useState<number | undefined>(undefined);
    const [y, setY] = useState<number | undefined>(undefined);
    const [paper, setPaper] = useState<CanvasRenderingContext2D | null>(null);
    const [isCanvasTouched, setIsCanvasTouched] = useState(false);
  
    const size = useResize();
    const { t } = useTranslation();
    const { message } = App.useApp();
  
    const { height, width } = useMemo(() => {
      if (size.width <= 700) {
        return { height: (size.height * 30) / 100, width: (size.width * 90) / 100 };
      } else {
        return { height: (size.height * 30) / 100, width: (size.width * 35) / 100 };
      }
    }, [size]);
  
    useEffect(() => {
      setIsCanvasTouched(false);
    }, [height, width]);
  
    const showFailedMessage = () => {
      message.open({
        content: <Message status="failed" text={t('profile.failed_save_changes')} />,
      });
    };
  
    const handleSubmit = () => {
      if (!canvasRef.current) return;
      if (!isCanvasTouched) {
        showFailedMessage();
        return;
      }
      canvasRef.current.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], crypto.getRandomValues(new Uint32Array(1))[0] + '.png', {
            type: 'image/png',
          });
          handleFinish(file);
        }
      });
    };
  
    // Функция для рисования линии, рисуется линия от стартовых до конечных координат
    const drawing_line = (
      color: string,
      x_start: number | undefined,
      y_start: number | undefined,
      x_end: number | undefined,
      y_end: number | undefined,
      board: CanvasRenderingContext2D,
    ) => {
      if (!(x_end && x_start && y_end && y_start)) return;
      setIsCanvasTouched(true);
      board.beginPath();
      board.strokeStyle = color;
      board.lineWidth = 2;
      // Перемещение пера до стартовой точки
      board.moveTo(x_start, y_start);
      // Рисование линии от пера до конечной точки
      board.lineTo(x_end, y_end);
      board.stroke();
      board.closePath();
    };
  
    // Установка начальных координат (мышь)
    const startDrawing: MouseEventHandler<HTMLCanvasElement> = (eventvs01) => {
      isMousePressed.current = true;
      setX(eventvs01.nativeEvent.offsetX);
      setY(eventvs01.nativeEvent.offsetY);
    };
  
    // Установка начальных координат (касание)
    const startTouchDrawing: TouchEventHandler<HTMLCanvasElement> = (eventvs01) => {
      isMousePressed.current = true;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const touch = eventvs01.touches[0];
        setX(touch.clientX - rect.left);
        setY(touch.clientY - rect.top);
      }
    };
  
    // Передача конечных координат в функцию рисования и подстановка их вместо начальных (мышь)
    const drawLine: MouseEventHandler<HTMLCanvasElement> = (eventvs02) => {
      if (isMousePressed.current && paper) {
        const xM = eventvs02.nativeEvent.offsetX;
        const yM = eventvs02.nativeEvent.offsetY;
        drawing_line('#000000', x, y, xM, yM, paper);
        setX(xM);
        setY(yM);
      }
    };
  
    // Передача конечных координат в функцию рисования и подстановка их вместо начальных (касание)
    const drawTouchLine: TouchEventHandler<HTMLCanvasElement> = (eventvs02) => {
      if (isMousePressed.current && paper) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const touch = eventvs02.touches[0];
          const xM = touch.clientX - rect.left;
          const yM = touch.clientY - rect.top;
          drawing_line('#000000', x, y, xM, yM, paper);
          setX(xM);
          setY(yM);
        }
      }
    };
  
    const stopDrawing = () => {
      isMousePressed.current = false;
    };
  
    const clearCanvas = () => {
      if (canvasRef.current && paper) {
        paper.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    };
  
    // Установка контекста рисования, не в useEffect так как при вмонтировании контекст рисования еще не инициализирован
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx && !paper) {
        setPaper(ctx);
      }
    }
  
    return (
      <Modal
        onCancel={handleClose}
        onClose={handleClose}
        headerProps={{
          showLogo: false,
          onCloseClick: handleClose,
          showStepBack: false,
          title: 'Draw signature',
        }}
        className={styles.modal}
        style={{ width, height }}
        {...rest}
      >
        <Flex vertical gap={16} align="center">
          <canvas
            className={styles.canvas}
            style={{ width, height }}
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={drawLine}
            onMouseUp={stopDrawing}
            onTouchStart={startTouchDrawing}
            onTouchMove={drawTouchLine}
            onTouchEnd={stopDrawing}
            width={width}
            height={height}
          ></canvas>
          <Flex gap={8}>
            <Button onClick={clearCanvas}>{t('common.reset')}</Button>
            <Button type="primary" onClick={handleSubmit}>
              {t('common.submit')}
            </Button>
          </Flex>
        </Flex>
      </Modal>
    );
  };
  