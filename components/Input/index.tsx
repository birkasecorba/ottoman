/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import cn from 'classnames';
import { FormEvent, useRef } from 'react';
import styles from './styles.module.css';

type InputProps = {
  label: string,
  value: string,
  onChange: (e: FormEvent<HTMLInputElement>) => any,
  className?: string,
  inputProps?: {
    [x: string]: any,
  }
  [x: string]: any,
}

export default function Input({
  label,
  className = '',
  value,
  onChange,
  inputProps,
  ...restProps
}: InputProps) {
  const inputRef = useRef<HTMLInputElement>();
  const inputClasses = cn(
    { [styles.filled]: value },
    className,
    styles.input,
    'border border-gray-400 appearance-none rounded w-full px-3 py-3 pt-5 pb-2 focus focus:border-indigo-600 focus:outline-none active:outline-none active:border-indigo-600',
  );

  const {
    className: wrapperClassName = '',
    ...wrapperRestProps
  } = restProps;

  return (
    <div className={`${wrapperClassName} relative`} {...wrapperRestProps}>
      <input
        className={inputClasses}
        value={value}
        type="text"
        onChange={onChange}
        ref={inputRef}
        {...inputProps}
      />
      <label
        htmlFor={label}
        onClick={() => inputRef.current.focus()}
        className={`${styles.label} absolute leading-tighter text-gray-400 text-base cursor-text`}
      >
        {label}
      </label>
    </div>
  );
}
